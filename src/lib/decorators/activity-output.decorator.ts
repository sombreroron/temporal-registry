import { ACTIVITY_OUTPUT_METADATA } from "../temporal-registry.consts";

export interface ActivityOutputMetadata {
    type?: any;
    isArray?: boolean;
    nullable?: boolean;
    enum?: readonly (string | number)[];
}

export function ActivityOutput(type: [new (...args: any[]) => any]): MethodDecorator;
export function ActivityOutput(type: new (...args: any[]) => any): MethodDecorator;
export function ActivityOutput(options: {
    type?: (new (...args: any[]) => any) | [new (...args: any[]) => any];
    nullable?: boolean;
    enum?: readonly (string | number)[];
}): MethodDecorator;
export function ActivityOutput(
    typeOrOptions:
        | (new (...args: any[]) => any)
        | [new (...args: any[]) => any]
        | {
              type?: (new (...args: any[]) => any) | [new (...args: any[]) => any];
              nullable?: boolean;
              enum?: readonly (string | number)[];
          },
): MethodDecorator {
    let type: any;
    let isArray = false;
    let nullable: boolean | undefined;
    let enumValues: readonly (string | number)[] | undefined;

    if (Array.isArray(typeOrOptions)) {
        type = typeOrOptions[0];
        isArray = true;
    } else if (typeof typeOrOptions === "function") {
        type = typeOrOptions;
    } else if (typeOrOptions.type) {
        if (Array.isArray(typeOrOptions.type)) {
            type = typeOrOptions.type[0];
            isArray = true;
        } else {
            type = typeOrOptions.type;
        }
        nullable = typeOrOptions.nullable;
        enumValues = typeOrOptions.enum;
    }

    const metadata: ActivityOutputMetadata = {
        type,
        isArray,
        nullable,
        enum: enumValues,
    };

    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, metadata, target, propertyKey);
        const originalBind = descriptor.value.bind;

        descriptor.value.bind = function (context: any, ...args: any[]) {
            const boundFn = originalBind.call(descriptor.value, context, ...args);
            const outputMeta = Reflect.getMetadata(ACTIVITY_OUTPUT_METADATA, target, propertyKey);

            Reflect.defineMetadata(ACTIVITY_OUTPUT_METADATA, outputMeta, boundFn);

            return boundFn;
        };

        return descriptor;
    };
}
