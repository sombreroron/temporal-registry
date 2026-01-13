import "reflect-metadata";
import { ActivityProperty, ActivityPropertyOptions } from "./activity-property.decorator";

export function ActivityPropertyOptional(options?: ActivityPropertyOptions): PropertyDecorator {
    return ActivityProperty({ ...options, optional: true });
}
