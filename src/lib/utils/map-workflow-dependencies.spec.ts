import { mapWorkflowDependencies } from "./map-workflow-dependencies";

describe("mapWorkflowDependencies", () => {
    it("should map dependencies of a workflow", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/mixed-activities.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "mixedActivitiesWorkflow",
            activities: [
                { name: "myActivity", taskQueue: "current-task-queue" },
                { name: "myOtherActivity", taskQueue: "current-task-queue" },
                { name: "myLocalActivity", taskQueue: "current-task-queue" },
                { name: "myOtherLocalActivity", taskQueue: "current-task-queue" },
                { name: "myRemoteTaskActivity", taskQueue: "remote-task-queue" },
                { name: "myOtherRemoteTaskActivity", taskQueue: "remote-task-queue" },
                { name: "myRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                { name: "mySecondRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
            ],
            childWorkflows: [],
        });
    });

    it("should handle workflows with only local activities", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/local-activities.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "localActivitiesWorkflow",
            activities: [
                { name: "localActivity1", taskQueue: "current-task-queue" },
                { name: "localActivity2", taskQueue: "current-task-queue" },
            ],
            childWorkflows: [],
        });
    });

    it("should handle workflows with only remote activities", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/remote-activities.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "remoteActivitiesWorkflow",
            activities: [
                { name: "remoteActivity1", taskQueue: "remote-queue" },
                { name: "remoteActivity2", taskQueue: "remote-queue" },
            ],
            childWorkflows: [],
        });
    });

    it("should handle workflows with mixed task queues", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/mixed-queues.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "mixedQueuesWorkflow",
            activities: [
                { name: "defaultActivity", taskQueue: "current-task-queue" },
                { name: "queueActivity1", taskQueue: "queue-1" },
                { name: "queueActivity2", taskQueue: "queue-2" },
            ],
            childWorkflows: [],
        });
    });

    it("should return empty activities for workflow without dependencies", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/no-activities.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "noActivitiesWorkflow",
            activities: [],
            childWorkflows: [],
        });
    });

    it("should handle class-based workflows", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/class-based.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "MyClassWorkflow",
            activities: [
                { name: "classActivity1", taskQueue: "current-task-queue" },
                { name: "classActivity2", taskQueue: "current-task-queue" },
                { name: "remoteClassActivity", taskQueue: "remote-queue" },
            ],
            childWorkflows: [],
        });
    });

    it("should handle workflows with child workflows - direct executeChild", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/child-workflows.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "childWorkflowsWorkflow",
            activities: [],
            childWorkflows: [
                { name: "myChildWorkflow", taskQueue: "child-task-queue" },
                { name: "anotherChildWorkflow", taskQueue: "current-task-queue" },
            ],
        });
    });

    it("should handle workflows with method-style executeChild calls", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/method-child-workflows.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "MethodChildWorkflow",
            activities: [],
            childWorkflows: [
                { name: "testWorkflow", taskQueue: "test-queue" },
                { name: "anotherTestWorkflow", taskQueue: "current-task-queue" },
            ],
        });
    });

    it("should handle workflows with executeChildOperation wrapper in Promise.all", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/wrapper-child-workflows.workflow.js"),
            "promiseAllWrapperWorkflow",
        );

        expect(dependencies).toEqual({
            name: "promiseAllWrapperWorkflow",
            activities: [],
            childWorkflows: [
                { name: "testChildWorkflow1", taskQueue: "test-queue-1" },
                { name: "testChildWorkflow2", taskQueue: "test-queue-2" },
            ],
        });
    });

    it("should not detect false positives when wrapper methods are called with non-workflow arguments", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/false-positive.workflow.js"),
            "mixedSignatureWrapperWorkflow",
        );

        expect(dependencies).toEqual({
            name: "mixedSignatureWrapperWorkflow",
            activities: [],
            childWorkflows: [
                // Should only detect the one with proper { type: ... } signature
                { name: "testChildWorkflow", taskQueue: "test-queue" },
            ],
        });
    });

    it("should detect child workflows when wrapper method is defined in parent class", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/parent-class-wrapper.workflow.js"),
            "childWorkflowFromParentClass",
        );

        expect(dependencies).toEqual({
            name: "childWorkflowFromParentClass",
            activities: [],
            childWorkflows: [
                { name: "exportFilesWorkflow", taskQueue: "fs-service" },
                { name: "exportDbWorkflow", taskQueue: "db-api" },
                { name: "deleteBackupWorkflow", taskQueue: "sites-backup" },
            ],
        });
    });

    it("should extract workflow name from member expression with .name property", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/member-expression-name.workflow.js"),
            "childWorkflowWithDotName",
        );

        expect(dependencies).toEqual({
            name: "childWorkflowWithDotName",
            activities: [],
            childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
        });
    });

    it("should extract taskQueue from wrapped function calls", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/wrapped-options.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "wrappedOptionsWorkflow",
            activities: [
                { name: "submitResult", taskQueue: "task-runner-queue" },
                { name: "processData", taskQueue: "TASK_RUNNER_QUEUE" },
            ],
            childWorkflows: [],
        });
    });

    it("should extract activities from base class when workflow extends another class", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/base-class-extension.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "testBaseClassWorkflow",
            activities: [
                // Activities from the base class (MockBaseWorkflow)
                { name: "baseActivity1", taskQueue: "base-activities" },
                { name: "baseActivity2", taskQueue: "base-activities" },
                { name: "baseActivity3", taskQueue: "base-activities" },
                { name: "baseActivity4", taskQueue: "base-activities" },
                { name: "baseActivity5", taskQueue: "base-activities" },
                { name: "baseActivity6", taskQueue: "base-activities" },
                { name: "baseActivity7", taskQueue: "base-activities" },
                // Activities from the child workflow (TestBaseClassWorkflow)
                { name: "childActivity1", taskQueue: "child-activities" },
                { name: "childActivity2", taskQueue: "child-activities" },
            ],
            childWorkflows: [],
        });
    });

    it("should handle activities called with dot notation (not destructured)", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/dot-notation-activities.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "dotNotationActivitiesWorkflow",
            activities: [
                { name: "importDb", taskQueue: "current-task-queue" },
                { name: "exportDb", taskQueue: "current-task-queue" },
                { name: "processData", taskQueue: "remote-task-queue" },
                { name: "sendNotification", taskQueue: "remote-task-queue" },
            ],
            childWorkflows: [],
        });
    });

    it("should handle child workflows with member expression (e.g., WORKFLOW_TYPES.workflowName)", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/member-expression-child-workflows.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "memberExpressionChildWorkflowsWorkflow",
            activities: [],
            childWorkflows: [
                { name: "deleteInstanceResources", taskQueue: "resource-task-queue" },
                { name: "instanceBackup", taskQueue: "backup-task-queue" },
                { name: "httpRulesDelete", taskQueue: "current-task-queue" },
            ],
        });
    });

    it("should NOT extract child workflows from non-constant member expressions (e.g., params.type)", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/member-expression-non-constant.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "memberExpressionNonConstantWorkflow",
            activities: [],
            childWorkflows: [],
        });
    });

    it("should handle nested member expressions from compiled TypeScript (e.g., constants_1.WORKFLOW_TYPES.workflowName)", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/nested-member-expression-child-workflows.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "nestedMemberExpressionChildWorkflowsWorkflow",
            activities: [],
            childWorkflows: [
                { name: "deleteResource", taskQueue: "resource-queue" },
                { name: "backupResource", taskQueue: "backup-queue" },
            ],
        });
    });

    it("should extract activities from instantiated classes dynamically loaded from objects", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/instantiated-classes.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "dynamicHandlerWorkflow",
            activities: [
                // Activities from the main workflow
                { name: "aggregateData", taskQueue: "MAIN_TASK_QUEUE" },
                { name: "getAvailableItems", taskQueue: "MAIN_TASK_QUEUE" },
                { name: "fetchEntities", taskQueue: "DATA_TASK_QUEUE" },
                // Activities from HandlerB
                { name: "startB", taskQueue: "TASK_QUEUE_B" },
                { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                // Activities from HandlerA
                { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
            ],
            childWorkflows: [],
        });
    });

    it("should extract activities from directly instantiated classes", () => {
        const dependencies = mapWorkflowDependencies(
            require.resolve("../mocks/workflows/class-instantiation.workflow.js"),
            "current-task-queue",
        );

        expect(dependencies).toEqual({
            name: "classInstantiationWorkflow",
            activities: [
                // Activities from the main workflow
                { name: "loadData", taskQueue: "WORKFLOW_TASK_QUEUE" },
                // Activities from HandlerA (directly instantiated)
                { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                // Activities from HandlerB (directly instantiated)
                { name: "startB", taskQueue: "TASK_QUEUE_B" },
                { name: "stopB", taskQueue: "TASK_QUEUE_B" },
            ],
            childWorkflows: [],
        });
    });
});
