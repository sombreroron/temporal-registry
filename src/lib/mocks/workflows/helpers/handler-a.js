"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandlerA = void 0;
const workflow_1 = require("@temporalio/workflow");
const base_handler_1 = require("./base-handler");

const handlerActivities = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "2 min",
    taskQueue: "TASK_QUEUE_A",
    retry: {
        maximumAttempts: 3,
        initialInterval: "3s",
        backoffCoefficient: 2,
    },
});

class HandlerA extends base_handler_1.BaseHandler {
    shouldProcess(data, entityData) {
        return !!data?.enabled || !!entityData?.enabled;
    }

    async execute(entityIds, data) {
        if (data?.enabled) {
            await Promise.all(entityIds.map((id) => handlerActivities.activateA(id)));
        } else {
            await Promise.all(entityIds.map((id) => handlerActivities.deactivateA(id)));
        }
    }
}
exports.HandlerA = HandlerA;

