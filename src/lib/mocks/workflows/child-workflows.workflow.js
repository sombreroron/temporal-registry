"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childWorkflowsWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");

// Direct executeChild calls with workflow name as first argument
async function childWorkflowsWorkflow(input) {
    // Direct call with string literal and taskQueue
    await (0, workflow_1.executeChild)("myChildWorkflow", {
        taskQueue: "child-task-queue",
        args: [input],
    });

    // Direct call without task queue specified
    await (0, workflow_1.executeChild)("anotherChildWorkflow", {
        args: [input],
    });

    return { success: true };
}
exports.childWorkflowsWorkflow = childWorkflowsWorkflow;
