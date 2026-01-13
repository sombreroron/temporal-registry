"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classInstantiationWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");
const handler_a_1 = require("./helpers/handler-a");
const handler_b_1 = require("./helpers/handler-b");

const workflowActivities = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "WORKFLOW_TASK_QUEUE",
    retry: {
        maximumAttempts: 3,
        initialInterval: "3s",
        backoffCoefficient: 2,
    },
});

async function classInstantiationWorkflow(input) {
    const data = await workflowActivities.loadData(input.id);

    if (!data) {
        return { success: false };
    }

    // Direct instantiation - not dynamic
    const handlerA = new handler_a_1.HandlerA();
    await handlerA.process("itemA", data.itemA, data.itemsPerEntity);

    const handlerB = new handler_b_1.HandlerB();
    await handlerB.process("itemB", data.itemB, data.itemsPerEntity);

    return { success: true };
}

exports.classInstantiationWorkflow = classInstantiationWorkflow;

