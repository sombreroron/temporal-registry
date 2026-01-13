import "reflect-metadata";
import { getActivityProperties } from "../decorators/activity-property.decorator";
import { ACTIVITY_INPUT_METADATA, ACTIVITY_OUTPUT_METADATA } from "../temporal-registry.consts";

interface PropertyTypeMetadata {
    type: string;
    elementType?: string | PropertyTypeMetadata;
    optional?: boolean;
    enum?: readonly (string | number)[];
    properties?: {
        [propertyName: string]: PropertyTypeMetadata;
    };
}

interface ClassMetadata {
    className: string;
    properties?: {
        [propertyName: string]: PropertyTypeMetadata;
    };
    nullable?: boolean;
    enum?: readonly (string | number)[];
}

interface ParamMetadata {
    name: string;
    type: any;
    optional?: boolean;
    enum?: readonly (string | number)[];
}

type ClassConstructor = new (...args: unknown[]) => unknown;

function isPrimitiveType(type: object): boolean {
    return (
        type === String ||
        type === Number ||
        type === Boolean ||
        type === BigInt ||
        type === Symbol ||
        type === Date ||
        type === RegExp ||
        type === Error
    );
}

function extractPropertyTypes(classConstructor: ClassConstructor): {
    [propertyName: string]: PropertyTypeMetadata;
} {
    const properties: { [propertyName: string]: PropertyTypeMetadata } = {};
    const prototype = classConstructor.prototype;
    const activityProperties = getActivityProperties(classConstructor);

    for (const prop of activityProperties) {
        const propName = prop.propertyName;

        if (prop.type) {
            const explicitType = prop.type;

            if (prop.isArray) {
                properties[propName] = {
                    type: "Array",
                    elementType: {
                        type: explicitType.name,
                        properties: isPrimitiveType(explicitType) ? undefined : extractPropertyTypes(explicitType),
                    },
                    optional: prop.optional,
                    enum: prop.enum,
                };
            } else {
                if (isPrimitiveType(explicitType)) {
                    properties[propName] = {
                        type: explicitType.name,
                        optional: prop.optional,
                        enum: prop.enum,
                    };
                } else {
                    properties[propName] = {
                        type: explicitType.name,
                        properties: extractPropertyTypes(explicitType),
                        optional: prop.optional,
                    };
                }
            }
        } else {
            const designType = Reflect.getMetadata("design:type", prototype, propName);

            if (!designType) continue;

            if (isPrimitiveType(designType)) {
                properties[propName] = {
                    type: designType.name,
                    optional: prop.optional,
                    enum: prop.enum,
                };
            } else if (designType === Array) {
                properties[propName] = {
                    type: "Array",
                    optional: prop.optional,
                    enum: prop.enum,
                };
            } else {
                properties[propName] = {
                    type: designType.name,
                    properties: extractPropertyTypes(designType),
                    optional: prop.optional,
                };
            }
        }
    }

    return properties;
}

function getParamMetadata(paramKey: any): {
    name: string;
    type: any;
    optional?: boolean;
    enum?: readonly (string | number)[];
} {
    const baseMetadata = {
        name: paramKey.name,
        optional: paramKey.optional,
        enum: paramKey.enum,
    };

    if (paramKey.isArray) {
        const elementType = paramKey.type;
        if (isPrimitiveType(elementType)) {
            return {
                ...baseMetadata,
                type: {
                    className: "Array",
                    properties: {
                        elementType: { type: elementType.name },
                    },
                },
            };
        } else {
            return {
                ...baseMetadata,
                type: {
                    className: "Array",
                    properties: {
                        elementType: {
                            type: elementType.name,
                            properties: extractPropertyTypes(elementType),
                        },
                    },
                },
            };
        }
    } else if (paramKey.type === Array) {
        return {
            ...baseMetadata,
            type: Array.name,
        };
    } else if (isPrimitiveType(paramKey.type)) {
        return {
            ...baseMetadata,
            type: paramKey.type.name,
        };
    } else {
        return {
            ...baseMetadata,
            type: {
                className: paramKey.type.name,
                properties: extractPropertyTypes(paramKey.type),
            },
        };
    }
}

export function extractActivityMetadata(activity: any): {
    input?: ParamMetadata[];
    output?: ClassMetadata | null;
} {
    const metadata: { input: any[]; output?: ClassMetadata } = { input: [] };

    if (typeof activity === "function") {
        const inputMetadata = Reflect.getMetadata(ACTIVITY_INPUT_METADATA, activity);
        const outputMetadata = Reflect.getMetadata(ACTIVITY_OUTPUT_METADATA, activity);

        if (Array.isArray(inputMetadata)) {
            for (const paramKey of inputMetadata) {
                metadata.input.push(getParamMetadata(paramKey));
            }
        }

        if (outputMetadata) {
            const outputType = outputMetadata.type || outputMetadata;
            const isArray = outputMetadata.isArray || false;
            const nullable = outputMetadata.nullable;
            const enumValues = outputMetadata.enum;

            if (isArray) {
                metadata.output = {
                    className: "Array",
                    properties: {
                        elementType: {
                            type: outputType.name,
                            properties: isPrimitiveType(outputType) ? undefined : extractPropertyTypes(outputType),
                        },
                    },
                    nullable,
                    enum: enumValues,
                };
            } else {
                metadata.output = {
                    className: outputType.name,
                    properties: isPrimitiveType(outputType) ? undefined : extractPropertyTypes(outputType),
                    nullable,
                    enum: enumValues,
                };
            }
        }

        return metadata;
    }

    return {};
}
