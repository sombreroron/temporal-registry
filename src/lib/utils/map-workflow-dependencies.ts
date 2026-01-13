import * as types from "@babel/types";
import { parse } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import * as path from "node:path";
import * as fs from "node:fs";
import { ActivityComponent, ChildWorkflowComponent, WorkflowComponent } from "../temporal-registry.types";

interface ImportMap {
    [localName: string]: string;
}

function isCallToFunction(node: types.CallExpression, ...functionNames: string[]): boolean {
    // Direct call: functionName(...)
    if (types.isIdentifier(node.callee)) {
        return functionNames.includes(node.callee.name);
    }

    // Compiled code: (0, obj.functionName)(...)
    if (types.isSequenceExpression(node.callee) && node.callee.expressions.length === 2) {
        const expr = node.callee.expressions[1];
        if (types.isMemberExpression(expr) && types.isIdentifier(expr.property)) {
            return functionNames.includes(expr.property.name);
        }
    }

    // Member expression: obj.functionName(...)
    if (types.isMemberExpression(node.callee) && types.isIdentifier(node.callee.property)) {
        return functionNames.includes(node.callee.property.name);
    }

    return false;
}

function extractActivityNamesFromPattern(pattern: types.ObjectPattern): string[] {
    const names: string[] = [];
    pattern.properties.forEach((prop) => {
        if (types.isObjectProperty(prop)) {
            const name = types.isIdentifier(prop.value)
                ? prop.value.name
                : types.isIdentifier(prop.key)
                ? prop.key.name
                : null;
            if (name) names.push(name);
        }
    });
    return names;
}

function findObjectProperty(obj: types.ObjectExpression, keyName: string): types.Node | undefined {
    for (const prop of obj.properties) {
        if (types.isObjectProperty(prop) && types.isIdentifier(prop.key) && prop.key.name === keyName) {
            return prop.value;
        }
    }
    return undefined;
}

function resolveImportPath(importSource: string, currentFilePath: string): string | undefined {
    const importPath = path.resolve(path.dirname(currentFilePath), importSource);
    const possiblePaths = [importPath, `${importPath}.js`, `${importPath}/index.js`];

    for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) return testPath;
    }
    return undefined;
}

function parseJavaScript(code: string): types.File {
    try {
        return parse(code, { sourceType: "script", plugins: ["classProperties"] });
    } catch {
        return parse(code, { sourceType: "module", plugins: ["classProperties"] });
    }
}

function resolveConstantValue(importSource: string, constantName: string, currentFilePath: string): string | undefined {
    try {
        const resolvedPath = resolveImportPath(importSource, currentFilePath);
        if (!resolvedPath || resolvedPath.endsWith(".map")) return undefined;

        const code = fs.readFileSync(resolvedPath, "utf8");
        const ast = parseJavaScript(code);

        let constantValue: string | undefined;

        traverse(ast, {
            VariableDeclarator(path) {
                if (types.isIdentifier(path.node.id) && path.node.id.name === constantName) {
                    if (types.isStringLiteral(path.node.init)) {
                        constantValue = path.node.init.value;
                    }
                }
            },
            ExportNamedDeclaration(path) {
                if (types.isVariableDeclaration(path.node.declaration)) {
                    path.node.declaration.declarations.forEach((decl) => {
                        if (
                            types.isVariableDeclarator(decl) &&
                            types.isIdentifier(decl.id) &&
                            decl.id.name === constantName &&
                            types.isStringLiteral(decl.init)
                        ) {
                            constantValue = decl.init.value;
                        }
                    });
                }
            },
            AssignmentExpression(path) {
                // exports.CONST = "value"
                if (
                    types.isMemberExpression(path.node.left) &&
                    types.isIdentifier(path.node.left.object, { name: "exports" }) &&
                    types.isIdentifier(path.node.left.property, { name: constantName }) &&
                    types.isStringLiteral(path.node.right)
                ) {
                    constantValue = path.node.right.value;
                }
            },
        });

        return constantValue;
    } catch {
        return undefined;
    }
}

function isProxyActivitiesCall(node: types.Node): boolean {
    return types.isCallExpression(node) && isCallToFunction(node, "proxyActivities", "proxyLocalActivities");
}

function extractTaskQueueFromMemberExpression(
    memberExpr: types.MemberExpression,
    importMap: ImportMap,
    currentFilePath: string,
): string | undefined {
    if (!types.isIdentifier(memberExpr.property)) return undefined;

    const constantName = memberExpr.property.name;

    if (types.isIdentifier(memberExpr.object)) {
        const importSource = importMap[memberExpr.object.name];
        if (importSource) {
            return resolveConstantValue(importSource, constantName, currentFilePath);
        }
    }

    return undefined;
}

function extractTaskQueue(
    callExpression: types.CallExpression,
    importMap: ImportMap,
    currentFilePath: string,
): string | undefined {
    const optionsArg = callExpression.arguments[0];

    // Handle direct object expression: proxyActivities({ taskQueue: "queue" })
    if (types.isObjectExpression(optionsArg)) {
        const taskQueueValue = findObjectProperty(optionsArg, "taskQueue");
        if (!taskQueueValue) return undefined;

        if (types.isStringLiteral(taskQueueValue)) {
            return taskQueueValue.value;
        }

        if (types.isMemberExpression(taskQueueValue) && types.isIdentifier(taskQueueValue.property)) {
            return (
                extractTaskQueueFromMemberExpression(taskQueueValue, importMap, currentFilePath) ||
                taskQueueValue.property.name
            );
        }

        return undefined;
    }

    // Handle function call wrapper: proxyActivities(generateOptions(TASK_QUEUE))
    if (types.isCallExpression(optionsArg)) {
        // Check if the first argument to the wrapper function is the task queue
        const firstArg = optionsArg.arguments[0];

        if (types.isStringLiteral(firstArg)) {
            return firstArg.value;
        }

        if (types.isIdentifier(firstArg)) {
            return firstArg.name;
        }

        if (types.isMemberExpression(firstArg)) {
            return extractTaskQueueFromMemberExpression(firstArg, importMap, currentFilePath);
        }
    }

    return undefined;
}

function findProxyUsages(ast: types.File, proxyName: string): string[] {
    const activityNames: string[] = [];

    traverse(ast, {
        CallExpression(path) {
            const { callee } = path.node;
            // Handle bracket notation: activities["importDb"]()
            if (
                types.isMemberExpression(callee, { computed: true }) &&
                types.isIdentifier(callee.object, { name: proxyName }) &&
                types.isStringLiteral(callee.property)
            ) {
                activityNames.push(callee.property.value);
            }
            // Handle dot notation: activities.importDb()
            else if (
                types.isMemberExpression(callee, { computed: false }) &&
                types.isIdentifier(callee.object, { name: proxyName }) &&
                types.isIdentifier(callee.property)
            ) {
                activityNames.push(callee.property.name);
            }
        },
        VariableDeclarator(path) {
            if (types.isObjectPattern(path.node.id) && types.isIdentifier(path.node.init, { name: proxyName })) {
                activityNames.push(...extractActivityNamesFromPattern(path.node.id));
            }
        },
    });

    return activityNames;
}

function processProxyActivities(
    ast: types.File,
    callExpression: types.CallExpression,
    bindingPattern: types.LVal | undefined,
    importMap: ImportMap,
    currentFilePath: string,
    workflowTaskQueue: string,
): ActivityComponent[] {
    const taskQueue = extractTaskQueue(callExpression, importMap, currentFilePath) || workflowTaskQueue;
    const activities: ActivityComponent[] = [];

    if (types.isObjectPattern(bindingPattern)) {
        extractActivityNamesFromPattern(bindingPattern).forEach((name) => {
            activities.push({ name, taskQueue });
        });
    } else if (types.isIdentifier(bindingPattern)) {
        findProxyUsages(ast, bindingPattern.name).forEach((name) => {
            activities.push({ name, taskQueue });
        });
    }

    return activities;
}

function findClassPropertyUsages(
    classPath: NodePath<types.ClassDeclaration>,
    propertyName: string,
    taskQueue: string | undefined,
): ActivityComponent[] {
    const activities: ActivityComponent[] = [];

    classPath.traverse({
        VariableDeclarator(path) {
            if (
                types.isObjectPattern(path.node.id) &&
                types.isMemberExpression(path.node.init) &&
                types.isThisExpression(path.node.init.object) &&
                types.isIdentifier(path.node.init.property, { name: propertyName })
            ) {
                extractActivityNamesFromPattern(path.node.id).forEach((name) => {
                    activities.push({ name, taskQueue });
                });
            }
        },
    });

    return activities;
}

function collectImports(ast: types.File): ImportMap {
    const importMap: ImportMap = {};

    traverse(ast, {
        ImportDeclaration(path) {
            path.node.specifiers.forEach((specifier) => {
                if (types.isImportNamespaceSpecifier(specifier) || types.isImportDefaultSpecifier(specifier)) {
                    importMap[specifier.local.name] = path.node.source.value;
                } else if (types.isImportSpecifier(specifier)) {
                    // Handle named imports: import { OperationWorkflow } from "..."
                    importMap[specifier.local.name] = path.node.source.value;
                }
            });
        },
        VariableDeclarator(path) {
            if (
                types.isIdentifier(path.node.id) &&
                types.isCallExpression(path.node.init) &&
                types.isIdentifier(path.node.init.callee, { name: "require" }) &&
                types.isStringLiteral(path.node.init.arguments[0])
            ) {
                importMap[path.node.id.name] = path.node.init.arguments[0].value;
            }
        },
    });

    return importMap;
}

function isConstantIdentifier(identifierName: string, ast: types.File, importMap: ImportMap): boolean {
    // Check if it's imported
    if (importMap[identifierName]) {
        return true;
    }

    // Check if it's declared as a const at module level
    let isConstant = false;

    traverse(ast, {
        VariableDeclaration(path) {
            // Only check top-level declarations (not inside functions/classes)
            if (path.parent.type === "Program" || path.parent.type === "ExportNamedDeclaration") {
                if (path.node.kind === "const") {
                    path.node.declarations.forEach((declaration) => {
                        if (types.isIdentifier(declaration.id) && declaration.id.name === identifierName) {
                            isConstant = true;
                        }
                    });
                }
            }
        },
    });

    return isConstant;
}

function isDirectExecuteChildCall(node: types.CallExpression): boolean {
    return (
        isCallToFunction(node, "executeChild") &&
        !(types.isMemberExpression(node.callee) && types.isThisExpression(node.callee.object))
    );
}

function containsExecuteChildCall(path: NodePath): boolean {
    let hasExecuteChild = false;
    path.traverse({
        CallExpression(callPath) {
            if (isDirectExecuteChildCall(callPath.node)) {
                hasExecuteChild = true;
                callPath.stop();
            }
        },
    });
    return hasExecuteChild;
}

function findWrapperMethodsThatCallExecuteChild(ast: types.File): Set<string> {
    const wrapperMethods = new Set<string>();

    traverse(ast, {
        FunctionDeclaration(path) {
            if (path.node.id && containsExecuteChildCall(path)) {
                wrapperMethods.add(path.node.id.name);
            }
        },
        ClassMethod(path) {
            if (types.isIdentifier(path.node.key) && containsExecuteChildCall(path)) {
                wrapperMethods.add(path.node.key.name);
            }
        },
        VariableDeclarator(path) {
            if (
                types.isIdentifier(path.node.id) &&
                (types.isArrowFunctionExpression(path.node.init) || types.isFunctionExpression(path.node.init)) &&
                containsExecuteChildCall(path.get("init") as NodePath)
            ) {
                wrapperMethods.add(path.node.id.name);
            }
        },
    });

    return wrapperMethods;
}

function hasObjectProperty(obj: types.ObjectExpression, keyName: string): boolean {
    return obj.properties.some(
        (prop) => types.isObjectProperty(prop) && types.isIdentifier(prop.key, { name: keyName }),
    );
}

function isExecuteChildCall(node: types.Node, wrapperMethods: Set<string>): boolean {
    if (!types.isCallExpression(node)) return false;

    if (isDirectExecuteChildCall(node)) return true;

    // Check for known wrapper method calls
    const calleeName = types.isIdentifier(node.callee)
        ? node.callee.name
        : types.isMemberExpression(node.callee) && types.isIdentifier(node.callee.property)
        ? node.callee.property.name
        : null;

    if (calleeName && wrapperMethods.has(calleeName)) {
        const firstArg = node.arguments[0];
        return types.isObjectExpression(firstArg) && hasObjectProperty(firstArg, "type");
    }

    // Fallback: Method calls with both 'type' and 'taskQueue' properties
    if (types.isMemberExpression(node.callee) && types.isObjectExpression(node.arguments[0])) {
        const firstArg = node.arguments[0];
        return hasObjectProperty(firstArg, "type") && hasObjectProperty(firstArg, "taskQueue");
    }

    return false;
}

function extractWorkflowNameFromMemberExpression(memberExpr: types.MemberExpression): string | undefined {
    // workflow.name -> "workflow", module.workflow.name -> "workflow"
    if (types.isIdentifier(memberExpr.property)) {
        if (memberExpr.property.name === "name") {
            // Get the object part (what comes before .name)
            if (types.isIdentifier(memberExpr.object)) {
                return memberExpr.object.name;
            }
            if (types.isMemberExpression(memberExpr.object) && types.isIdentifier(memberExpr.object.property)) {
                return memberExpr.object.property.name;
            }
        } else {
            // If property is not "name", use it as the workflow name
            return memberExpr.property.name;
        }
    }
    return undefined;
}

function extractTaskQueueFromOptions(
    optionsObject: types.ObjectExpression,
    importMap: ImportMap,
    currentFilePath: string,
): string | undefined {
    const taskQueueValue = findObjectProperty(optionsObject, "taskQueue");
    if (!taskQueueValue) return undefined;

    if (types.isStringLiteral(taskQueueValue)) {
        return taskQueueValue.value;
    }

    if (types.isIdentifier(taskQueueValue)) {
        return taskQueueValue.name;
    }

    if (types.isMemberExpression(taskQueueValue)) {
        if (types.isCallExpression(taskQueueValue.object)) return undefined;

        return extractTaskQueueFromMemberExpression(taskQueueValue, importMap, currentFilePath);
    }

    return undefined;
}

function extractChildWorkflowInfo(
    callExpression: types.CallExpression,
    importMap: ImportMap,
    currentFilePath: string,
    ast: types.File,
): { name: string | undefined; taskQueue: string | undefined } {
    const firstArg = callExpression.arguments[0];
    if (!firstArg) return { name: undefined, taskQueue: undefined };

    let workflowName: string | undefined;
    let taskQueue: string | undefined;

    // Pattern 1: executeChild(workflowType, options)
    if (types.isStringLiteral(firstArg)) {
        workflowName = firstArg.value;
        if (types.isObjectExpression(callExpression.arguments[1])) {
            taskQueue = extractTaskQueueFromOptions(callExpression.arguments[1], importMap, currentFilePath);
        }
    } else if (types.isIdentifier(firstArg) && isDirectExecuteChildCall(callExpression)) {
        workflowName = firstArg.name;
        if (types.isObjectExpression(callExpression.arguments[1])) {
            taskQueue = extractTaskQueueFromOptions(callExpression.arguments[1], importMap, currentFilePath);
        }
    } else if (types.isMemberExpression(firstArg) && isDirectExecuteChildCall(callExpression)) {
        // Handle: executeChild(WORKFLOW_TYPES.workflowName, options)
        // Also handles: executeChild(constants_1.WORKFLOW_TYPES.workflowName, options)

        // Check if it's a simple member expression: OBJECT.property
        if (types.isIdentifier(firstArg.object) && types.isIdentifier(firstArg.property)) {
            const objectName = firstArg.object.name;

            if (isConstantIdentifier(objectName, ast, importMap)) {
                workflowName = firstArg.property.name;
                if (types.isObjectExpression(callExpression.arguments[1])) {
                    taskQueue = extractTaskQueueFromOptions(callExpression.arguments[1], importMap, currentFilePath);
                }
            }
        }
        // Check if it's a nested member expression: namespace.OBJECT.property
        else if (
            types.isMemberExpression(firstArg.object) &&
            types.isIdentifier(firstArg.object.object) &&
            types.isIdentifier(firstArg.object.property) &&
            types.isIdentifier(firstArg.property)
        ) {
            const namespaceName = firstArg.object.object.name;

            // Check if namespace is imported
            if (isConstantIdentifier(namespaceName, ast, importMap)) {
                workflowName = firstArg.property.name;
                if (types.isObjectExpression(callExpression.arguments[1])) {
                    taskQueue = extractTaskQueueFromOptions(callExpression.arguments[1], importMap, currentFilePath);
                }
            }
        }
    } else if (types.isObjectExpression(firstArg)) {
        // Pattern 2: executeChild({ type: "workflowName", ... })
        const typeValue = findObjectProperty(firstArg, "type");
        if (types.isStringLiteral(typeValue)) {
            workflowName = typeValue.value;
        } else if (types.isIdentifier(typeValue)) {
            workflowName = typeValue.name;
        } else if (types.isMemberExpression(typeValue)) {
            workflowName = extractWorkflowNameFromMemberExpression(typeValue);
        }
        taskQueue = extractTaskQueueFromOptions(firstArg, importMap, currentFilePath);
    }

    return { name: workflowName, taskQueue };
}

function parseWorkflowFile(code: string, absolutePath: string): types.File {
    const BABEL_PLUGINS = [
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "dynamicImport",
        "nullishCoalescingOperator",
        "optionalChaining",
        "objectRestSpread",
    ] as const;

    const BABEL_OPTIONS = {
        allowReturnOutsideFunction: true,
        allowAwaitOutsideFunction: true,
        allowSuperOutsideMethod: true,
        errorRecovery: true,
    };

    try {
        return parse(code, {
            sourceType: "script",
            plugins: [...BABEL_PLUGINS],
            ...BABEL_OPTIONS,
        });
    } catch {
        try {
            return parse(code, {
                sourceType: "module",
                plugins: [...BABEL_PLUGINS, "exportDefaultFrom", "exportNamespaceFrom"],
                ...BABEL_OPTIONS,
            });
        } catch (error) {
            throw new Error(
                `Failed to parse JavaScript workflow file at ${absolutePath}: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }
}

function extractExportedWorkflowName(ast: types.File): string | undefined {
    let workflowName: string | undefined;

    traverse(ast, {
        ExportNamedDeclaration(path) {
            if (
                (types.isFunctionDeclaration(path.node.declaration) ||
                    types.isClassDeclaration(path.node.declaration)) &&
                path.node.declaration.id
            ) {
                workflowName = path.node.declaration.id.name;
            }
        },
        ExportDefaultDeclaration(path) {
            const decl = path.node.declaration;
            if ((types.isFunctionDeclaration(decl) || types.isClassDeclaration(decl)) && decl.id) {
                workflowName = decl.id.name;
            } else if (types.isIdentifier(decl)) {
                workflowName = decl.name;
            }
        },
        AssignmentExpression(path) {
            if (!types.isMemberExpression(path.node.left)) return;

            const { object, property } = path.node.left;
            if (types.isIdentifier(object, { name: "exports" }) && types.isIdentifier(property)) {
                workflowName = property.name;
            } else if (
                types.isIdentifier(object, { name: "module" }) &&
                types.isIdentifier(property, { name: "exports" }) &&
                types.isIdentifier(path.node.right)
            ) {
                workflowName = path.node.right.name;
            }
        },
    });

    return workflowName;
}

function extractActivitiesFromVariableDeclarations(
    ast: types.File,
    importMap: ImportMap,
    absolutePath: string,
    workflowTaskQueue: string,
): ActivityComponent[] {
    const activities: ActivityComponent[] = [];

    traverse(ast, {
        VariableDeclaration(path) {
            path.node.declarations.forEach((declaration) => {
                if (declaration.init && isProxyActivitiesCall(declaration.init)) {
                    // Filter out VoidPattern which is not a valid LVal
                    const declarationId = types.isLVal(declaration.id) ? declaration.id : undefined;
                    activities.push(
                        ...processProxyActivities(
                            ast,
                            declaration.init as types.CallExpression,
                            declarationId,
                            importMap,
                            absolutePath,
                            workflowTaskQueue,
                        ),
                    );
                }
            });
        },
    });

    return activities;
}

function extractActivitiesFromClasses(
    ast: types.File,
    importMap: ImportMap,
    absolutePath: string,
    workflowTaskQueue: string,
): ActivityComponent[] {
    const activities: ActivityComponent[] = [];

    traverse(ast, {
        ClassDeclaration(path) {
            path.node.body.body.forEach((member) => {
                if (
                    types.isClassProperty(member) &&
                    member.value &&
                    isProxyActivitiesCall(member.value) &&
                    types.isIdentifier(member.key)
                ) {
                    const taskQueue =
                        extractTaskQueue(member.value as types.CallExpression, importMap, absolutePath) ||
                        workflowTaskQueue;
                    activities.push(...findClassPropertyUsages(path, member.key.name, taskQueue));
                }
            });

            path.traverse({
                ClassMethod(methodPath) {
                    if (methodPath.node.kind !== "constructor") return;

                    methodPath.node.body.body.forEach((statement) => {
                        if (
                            !types.isExpressionStatement(statement) ||
                            !types.isAssignmentExpression(statement.expression) ||
                            !types.isMemberExpression(statement.expression.left) ||
                            !types.isThisExpression(statement.expression.left.object) ||
                            !types.isIdentifier(statement.expression.left.property) ||
                            !isProxyActivitiesCall(statement.expression.right)
                        ) {
                            return;
                        }

                        const propertyName = statement.expression.left.property.name;
                        const callExpression = statement.expression.right as types.CallExpression;
                        const taskQueue =
                            extractTaskQueue(callExpression, importMap, absolutePath) || workflowTaskQueue;
                        activities.push(...findClassPropertyUsages(path, propertyName, taskQueue));
                    });
                },
            });
        },
    });

    return activities;
}

function extractChildWorkflows(
    ast: types.File,
    wrapperMethods: Set<string>,
    importMap: ImportMap,
    absolutePath: string,
    workflowTaskQueue: string,
): ChildWorkflowComponent[] {
    const childWorkflows: ChildWorkflowComponent[] = [];

    traverse(ast, {
        CallExpression(path) {
            if (!isExecuteChildCall(path.node, wrapperMethods)) return;

            const { name, taskQueue = workflowTaskQueue } = extractChildWorkflowInfo(
                path.node,
                importMap,
                absolutePath,
                ast,
            );
            if (!name) return;

            const exists = childWorkflows.some((child) => child.name === name && child.taskQueue === taskQueue);
            if (!exists) {
                childWorkflows.push({ name, taskQueue });
            }
        },
    });

    return childWorkflows;
}

function findBaseClassName(ast: types.File): { name: string; source?: string } | undefined {
    let result: { name: string; source?: string } | undefined;

    traverse(ast, {
        ClassDeclaration(path) {
            if (!path.node.superClass) return;

            // Handle direct identifier: class X extends Y
            if (types.isIdentifier(path.node.superClass)) {
                result = { name: path.node.superClass.name };
                path.stop();
            }
            // Handle member expression: class X extends module.Y
            else if (types.isMemberExpression(path.node.superClass)) {
                if (
                    types.isIdentifier(path.node.superClass.object) &&
                    types.isIdentifier(path.node.superClass.property)
                ) {
                    result = {
                        name: path.node.superClass.property.name,
                        source: path.node.superClass.object.name,
                    };
                    path.stop();
                }
            }
        },
    });

    return result;
}

function findExportedClassInFile(
    className: string,
    filePath: string,
    visitedFiles: Set<string> = new Set(),
): string | undefined {
    if (visitedFiles.has(filePath) || !fs.existsSync(filePath)) return undefined;
    visitedFiles.add(filePath);

    try {
        const code = fs.readFileSync(filePath, "utf8");
        const ast = parseWorkflowFile(code, filePath);
        let foundInThisFile = false;

        // Check if the class is defined in this file
        traverse(ast, {
            ClassDeclaration(path) {
                if (path.node.id && path.node.id.name === className) {
                    foundInThisFile = true;
                    path.stop();
                }
            },
            ExportNamedDeclaration(path) {
                if (types.isClassDeclaration(path.node.declaration) && path.node.declaration.id?.name === className) {
                    foundInThisFile = true;
                    path.stop();
                }
            },
        });

        if (foundInThisFile) {
            return filePath;
        }

        // Check for __exportStar re-exports: tslib_1.__exportStar(require("./other-file"), exports);
        const reExportPaths: string[] = [];
        traverse(ast, {
            CallExpression(path) {
                // Match pattern: tslib_1.__exportStar(require("./path"), exports)
                if (
                    types.isMemberExpression(path.node.callee) &&
                    types.isIdentifier(path.node.callee.property, { name: "__exportStar" }) &&
                    path.node.arguments.length >= 1
                ) {
                    const firstArg = path.node.arguments[0];
                    if (
                        types.isCallExpression(firstArg) &&
                        types.isIdentifier(firstArg.callee, { name: "require" }) &&
                        types.isStringLiteral(firstArg.arguments[0])
                    ) {
                        reExportPaths.push(firstArg.arguments[0].value);
                    }
                }
            },
        });

        // Follow re-exports
        for (const reExportPath of reExportPaths) {
            const resolvedPath = resolveImportPath(reExportPath, filePath);
            if (resolvedPath) {
                const result = findExportedClassInFile(className, resolvedPath, visitedFiles);
                if (result) return result;
            }
        }

        return undefined;
    } catch {
        return undefined;
    }
}

function resolveBaseClassPath(
    baseClassInfo: { name: string; source?: string },
    importMap: ImportMap,
    currentFilePath: string,
): string | undefined {
    // Use the source from member expression if available, otherwise look up in import map
    const moduleName = baseClassInfo.source || baseClassInfo.name;
    const importSource = importMap[moduleName];
    if (!importSource) return undefined;

    // Try to resolve as a local file first
    const localPath = resolveImportPath(importSource, currentFilePath);
    if (localPath) {
        // For local files, try to find where the class is actually defined
        return findExportedClassInFile(baseClassInfo.name, localPath);
    }

    // Try to resolve as a node_modules package
    try {
        // For packages like "@elementor/temporal-workflow", we need to resolve the main file
        const packagePath = require.resolve(importSource, { paths: [path.dirname(currentFilePath)] });
        // Follow re-exports to find where the class is actually defined
        return findExportedClassInFile(baseClassInfo.name, packagePath);
    } catch {
        return undefined;
    }
}

function extractActivitiesFromBaseClass(
    ast: types.File,
    importMap: ImportMap,
    currentFilePath: string,
    workflowTaskQueue: string,
    visitedFiles: Set<string> = new Set(),
): ActivityComponent[] {
    const baseClassInfo = findBaseClassName(ast);

    if (!baseClassInfo) return [];

    const baseClassPath = resolveBaseClassPath(baseClassInfo, importMap, currentFilePath);
    if (!baseClassPath || visitedFiles.has(baseClassPath)) return [];

    visitedFiles.add(baseClassPath);

    try {
        const code = fs.readFileSync(baseClassPath, "utf8");
        const ast = parseWorkflowFile(code, baseClassPath);
        const baseImportMap = collectImports(ast);

        // Extract activities from the base class
        const variableActivities = extractActivitiesFromVariableDeclarations(
            ast,
            baseImportMap,
            baseClassPath,
            workflowTaskQueue,
        );
        const classActivities = extractActivitiesFromClasses(ast, baseImportMap, baseClassPath, workflowTaskQueue);

        // Check if the base class itself extends another class
        const parentActivities = extractActivitiesFromBaseClass(
            ast,
            baseImportMap,
            baseClassPath,
            workflowTaskQueue,
            visitedFiles,
        );

        return [...variableActivities, ...classActivities, ...parentActivities];
    } catch (error) {
        return [];
    }
}

/**
 * Extracts class names that are instantiated in the workflow.
 * Handles patterns like:
 * - new ClassName()
 * - new module.ClassName() (CommonJS imports)
 * - new obj[key]()  (extracts class names from obj definition)
 */
function findInstantiatedClasses(ast: types.File): Map<string, { className: string; moduleName?: string }> {
    const instantiatedClasses = new Map<string, { className: string; moduleName?: string }>();

    traverse(ast, {
        NewExpression(path) {
            // Direct instantiation: new ClassName()
            if (types.isIdentifier(path.node.callee)) {
                instantiatedClasses.set(path.node.callee.name, {
                    className: path.node.callee.name,
                });
            }
            // Member expression: new obj.ClassName() or new obj[key]()
            else if (types.isMemberExpression(path.node.callee)) {
                if (types.isIdentifier(path.node.callee.object)) {
                    const objectName = path.node.callee.object.name;

                    // Case 1: Static member access: new module.ClassName()
                    if (!path.node.callee.computed && types.isIdentifier(path.node.callee.property)) {
                        const className = path.node.callee.property.name;
                        instantiatedClasses.set(className, {
                            className,
                            moduleName: objectName,
                        });
                    }
                    // Case 2: Dynamic access: new obj[key]()
                    else {
                        // Find the object definition to extract class names
                        const classes = findClassesInObject(ast, objectName);
                        classes.forEach((classInfo, className) => {
                            instantiatedClasses.set(className, classInfo);
                        });
                    }
                }
            }
        },
    });

    return instantiatedClasses;
}

/**
 * Finds class names in an object definition.
 * Handles patterns like:
 * - const obj = { key1: Class1, key2: Class2 };
 * - const obj: Record<string, new () => BaseClass> = { key1: Class1, key2: Class2 };
 * - const obj = { key1: module_1.Class1, key2: module_2.Class2 }; (CommonJS compiled)
 *
 * Returns a map of className -> { className, moduleName }
 */
function findClassesInObject(
    ast: types.File,
    objectName: string,
): Map<string, { className: string; moduleName?: string }> {
    const classMap = new Map<string, { className: string; moduleName?: string }>();

    traverse(ast, {
        VariableDeclarator(path) {
            if (!types.isIdentifier(path.node.id, { name: objectName })) return;
            if (!types.isObjectExpression(path.node.init)) return;

            path.node.init.properties.forEach((prop) => {
                if (types.isObjectProperty(prop)) {
                    // Handle direct identifier: { key: ClassName }
                    if (types.isIdentifier(prop.value)) {
                        classMap.set(prop.value.name, {
                            className: prop.value.name,
                        });
                    }
                    // Handle member expression: { key: module.ClassName } (CommonJS)
                    else if (
                        types.isMemberExpression(prop.value) &&
                        types.isIdentifier(prop.value.object) &&
                        types.isIdentifier(prop.value.property)
                    ) {
                        classMap.set(prop.value.property.name, {
                            className: prop.value.property.name,
                            moduleName: prop.value.object.name,
                        });
                    }
                }
            });
        },
    });

    return classMap;
}

/**
 * Extracts activities from imported class files by analyzing their proxyActivities calls.
 */
function extractActivitiesFromImportedClass(
    classInfo: { className: string; moduleName?: string },
    importMap: ImportMap,
    currentFilePath: string,
    workflowTaskQueue: string,
    visitedFiles: Set<string> = new Set(),
): ActivityComponent[] {
    // Find the import source for this class
    // First try the class name directly, then try the module name (for CommonJS)
    const importSource = importMap[classInfo.className] || (classInfo.moduleName && importMap[classInfo.moduleName]);
    if (!importSource) return [];

    // Resolve the file path
    const resolvedPath = resolveImportPath(importSource, currentFilePath);
    if (!resolvedPath || visitedFiles.has(resolvedPath)) return [];

    visitedFiles.add(resolvedPath);

    try {
        const code = fs.readFileSync(resolvedPath, "utf8");
        const ast = parseWorkflowFile(code, resolvedPath);
        const fileImportMap = collectImports(ast);

        // Extract activities from this class file
        const variableActivities = extractActivitiesFromVariableDeclarations(
            ast,
            fileImportMap,
            resolvedPath,
            workflowTaskQueue,
        );
        const classActivities = extractActivitiesFromClasses(ast, fileImportMap, resolvedPath, workflowTaskQueue);

        return [...variableActivities, ...classActivities];
    } catch (error) {
        return [];
    }
}

/**
 * Extracts activities from all instantiated classes in the workflow.
 * This handles scenarios where classes are imported, instantiated, and contain proxyActivities calls.
 */
function extractActivitiesFromInstantiatedClasses(
    ast: types.File,
    importMap: ImportMap,
    absolutePath: string,
    workflowTaskQueue: string,
): ActivityComponent[] {
    const instantiatedClasses = findInstantiatedClasses(ast);
    const activities: ActivityComponent[] = [];
    const visitedFiles = new Set<string>();

    for (const classInfo of instantiatedClasses.values()) {
        const classActivities = extractActivitiesFromImportedClass(
            classInfo,
            importMap,
            absolutePath,
            workflowTaskQueue,
            visitedFiles,
        );
        activities.push(...classActivities);
    }

    return activities;
}

export function mapWorkflowDependencies(workflowPath: string, workflowTaskQueue: string): WorkflowComponent {
    const absolutePath = path.resolve(workflowPath);
    const code = fs.readFileSync(absolutePath, "utf8");
    const ast = parseWorkflowFile(code, absolutePath);
    const importMap = collectImports(ast);
    const wrapperMethods = findWrapperMethodsThatCallExecuteChild(ast);
    const workflowName = extractExportedWorkflowName(ast);
    const baseClassActivities = extractActivitiesFromBaseClass(ast, importMap, absolutePath, workflowTaskQueue);
    const classActivities = extractActivitiesFromClasses(ast, importMap, absolutePath, workflowTaskQueue);
    const childWorkflows = extractChildWorkflows(ast, wrapperMethods, importMap, absolutePath, workflowTaskQueue);
    const variableActivities = extractActivitiesFromVariableDeclarations(
        ast,
        importMap,
        absolutePath,
        workflowTaskQueue,
    );
    const instantiatedClassActivities = extractActivitiesFromInstantiatedClasses(
        ast,
        importMap,
        absolutePath,
        workflowTaskQueue,
    );
    const activities = [
        ...baseClassActivities,
        ...classActivities,
        ...variableActivities,
        ...instantiatedClassActivities,
    ].filter(
        (activity, index, self) =>
            index === self.findIndex((a) => a.name === activity.name && a.taskQueue === activity.taskQueue),
    );

    return {
        name: workflowName,
        activities,
        childWorkflows,
    };
}
