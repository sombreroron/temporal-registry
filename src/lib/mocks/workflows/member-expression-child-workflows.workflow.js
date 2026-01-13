"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberExpressionChildWorkflowsWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");

// Mock WORKFLOW_TYPES constant object
const WORKFLOW_TYPES = {
    deleteInstanceResources: "deleteInstanceResources",
    instanceBackup: "instanceBackup",
    httpRulesDelete: "httpRulesDelete",
};

// executeChild calls with member expression as first argument (e.g., WORKFLOW_TYPES.workflowName)
async function memberExpressionChildWorkflowsWorkflow(input) {
    // Call with member expression and taskQueue
    await (0, workflow_1.executeChild)(WORKFLOW_TYPES.deleteInstanceResources, {
        taskQueue: "resource-task-queue",
        args: [input.instanceId],
    });

    // Call with member expression, different taskQueue
    await (0, workflow_1.executeChild)(WORKFLOW_TYPES.instanceBackup, {
        taskQueue: "backup-task-queue",
        args: [input.instanceId, "manual"],
    });

    // Call with member expression, no explicit taskQueue (should use default)
    await (0, workflow_1.executeChild)(WORKFLOW_TYPES.httpRulesDelete, {
        args: [{ instanceId: input.instanceId }],
    });

    return { success: true };
}
exports.memberExpressionChildWorkflowsWorkflow = memberExpressionChildWorkflowsWorkflow;




