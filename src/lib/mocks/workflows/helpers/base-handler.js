"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseHandler = void 0;

/**
 * Base class for handlers
 */
class BaseHandler {
    async process(itemName, data, dataPerEntity, entitiesMap) {
        const entityIds = Object.keys(dataPerEntity).reduce((ids, entityId) => {
            const entityData = dataPerEntity[entityId][itemName];
            const entity = entitiesMap?.[entityId];
            if (this.shouldProcess(data, entityData, entity)) {
                ids.push(parseInt(entityId));
            }
            return ids;
        }, []);

        if (entityIds.length) {
            await this.execute(entityIds, data);
        }
    }
}
exports.BaseHandler = BaseHandler;

