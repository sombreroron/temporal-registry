"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandlerB = void 0;
const workflow_1 = require("@temporalio/workflow");
const base_handler_1 = require("./base-handler");

const handlerActivities = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "30 sec",
    taskQueue: "TASK_QUEUE_B",
    retry: {
        maximumAttempts: 3,
        initialInterval: "3s",
        backoffCoefficient: 2,
    },
});

class HandlerB extends base_handler_1.BaseHandler {
    shouldProcess(data, entityData) {
        return data?.status !== entityData?.status;
    }

    async execute(entityIds, data) {
        if (data?.status === "active") {
            await Promise.all(entityIds.map((id) => handlerActivities.startB(id)));
        } else {
            await Promise.all(entityIds.map((id) => handlerActivities.stopB(id)));
        }
    }
}
exports.HandlerB = HandlerB;

