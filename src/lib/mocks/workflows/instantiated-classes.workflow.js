"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicHandlerWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");
const handler_a_1 = require("./helpers/handler-a");
const handler_b_1 = require("./helpers/handler-b");

const mainActivities = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "30 sec",
    taskQueue: "MAIN_TASK_QUEUE",
    retry: {
        maximumAttempts: 3,
        initialInterval: "3s",
        backoffCoefficient: 2,
    },
});

const dataActivities = (0, workflow_1.proxyActivities)({
    taskQueue: "DATA_TASK_QUEUE",
    startToCloseTimeout: "30 sec",
    retry: {
        maximumAttempts: 3,
        initialInterval: "3s",
        backoffCoefficient: 2,
    },
});

const handlers = {
    handlerB: handler_b_1.HandlerB,
    handlerA: handler_a_1.HandlerA,
};

async function dynamicHandlerWorkflow(input) {
    const entities = input.entities || (await dataActivities.fetchEntities({ status: "active" }));

    if (!entities.length) {
        return {};
    }

    const dataPerEntity = await mainActivities.aggregateData(entities);

    for (const itemName of await mainActivities.getAvailableItems()) {
        if (handlers[itemName]) {
            await new handlers[itemName]().process(
                itemName,
                input.items[itemName],
                dataPerEntity,
            );
        }
    }

    return input.items;
}

exports.dynamicHandlerWorkflow = dynamicHandlerWorkflow;

