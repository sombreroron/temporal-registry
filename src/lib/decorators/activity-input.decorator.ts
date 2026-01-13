import "reflect-metadata";
import { ACTIVITY_INPUT_METADATA } from "../temporal-registry.consts";

interface ActivityInputOption {
    type: any;
    name: string;
    optional?: boolean;
    enum?: readonly (string | number)[];
    isArray?: boolean;
}

export function ActivityInput(
    name: string,
    options: {
        type?: any;
        optional?: boolean;
        enum?: readonly (string | number)[];
    } = {},
): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        if (propertyKey) {
            const originalBind = (target as any)[propertyKey].bind;
            const input = Reflect.getMetadata(ACTIVITY_INPUT_METADATA, target, propertyKey) || [];
            const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);

            let type: any;
            let isArray = false;

            if (options?.type) {
                if (Array.isArray(options.type)) {
                    type = options.type[0];
                    isArray = true;
                } else {
                    type = options.type;
                }
            } else {
                type = paramTypes[parameterIndex];
            }

            input[parameterIndex] = {
                type,
                name,
                optional: options.optional,
                enum: options.enum,
                isArray,
            } as ActivityInputOption;

            Reflect.defineMetadata(ACTIVITY_INPUT_METADATA, input, target, propertyKey);

            (target as any)[propertyKey].bind = function (context: any, ...args: any[]) {
                const boundFn = originalBind.call((target as any)[propertyKey], context, ...args);
                const inputMeta = Reflect.getMetadata(ACTIVITY_INPUT_METADATA, target, propertyKey);

                Reflect.defineMetadata(ACTIVITY_INPUT_METADATA, inputMeta, boundFn);

                return boundFn;
            };
        }
    };
}
