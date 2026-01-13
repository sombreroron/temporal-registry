import "reflect-metadata";

export const ACTIVITY_PROPERTY_METADATA = "activity:property";

export interface ActivityPropertyMetadata {
    propertyName: string;
    type?: any;
    optional?: boolean;
    isArray?: boolean;
    enum?: readonly (string | number)[];
}

export interface ActivityPropertyOptions {
    type?: any;
    optional?: boolean;
    enum?: readonly (string | number)[];
}

export function ActivityProperty(options?: ActivityPropertyOptions): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const existingProperties: ActivityPropertyMetadata[] =
            Reflect.getMetadata(ACTIVITY_PROPERTY_METADATA, target.constructor) || [];
        let type: any | undefined;
        let isArray = false;

        if (options?.type) {
            if (Array.isArray(options.type)) {
                type = options.type[0];
                isArray = true;
            } else {
                type = options.type;
            }
        }

        existingProperties.push({
            propertyName: propertyKey as string,
            optional: options?.optional,
            enum: options?.enum,
            type,
            isArray,
        });

        Reflect.defineMetadata(ACTIVITY_PROPERTY_METADATA, existingProperties, target.constructor);
    };
}

export function getActivityProperties(target: any): ActivityPropertyMetadata[] {
    return Reflect.getMetadata(ACTIVITY_PROPERTY_METADATA, target) || [];
}
