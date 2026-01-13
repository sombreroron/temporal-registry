"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrappedOptionsWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");

// Mock helper function that wraps activity options
function generateRetriableActivityOptions(taskQueue) {
    return {
        startToCloseTimeout: "10 sec",
        taskQueue: taskQueue,
        retry: {
            maximumAttempts: 3,
        },
    };
}

// Pattern 1: Function wrapper with string literal
const { submitResult } = (0, workflow_1.proxyActivities)(generateRetriableActivityOptions("task-runner-queue"));

// Pattern 2: Function wrapper with constant
const TASK_RUNNER_QUEUE = "another-task-queue";
const { processData } = (0, workflow_1.proxyActivities)(generateRetriableActivityOptions(TASK_RUNNER_QUEUE));

function wrappedOptionsWorkflow() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield submitResult();
        yield processData();
    });
}
exports.wrappedOptionsWorkflow = wrappedOptionsWorkflow;
//# sourceMappingURL=wrapped-options.workflow.js.map

