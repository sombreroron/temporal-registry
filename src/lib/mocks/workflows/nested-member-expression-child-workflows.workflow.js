"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nestedMemberExpressionChildWorkflowsWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");
const constants_1 = require("./mock-constants");

// This simulates TypeScript compiled code where WORKFLOW_TYPES is imported as a namespace
// executeChild(constants_1.WORKFLOW_TYPES.workflowName, options)
async function nestedMemberExpressionChildWorkflowsWorkflow(input) {
    // Nested member expression: constants_1.WORKFLOW_TYPES.deleteResource
    await (0, workflow_1.executeChild)(constants_1.WORKFLOW_TYPES.deleteResource, {
        taskQueue: "resource-queue",
        args: [input.resourceId],
    });

    // Another nested member expression
    await (0, workflow_1.executeChild)(constants_1.WORKFLOW_TYPES.backupResource, {
        taskQueue: "backup-queue",
        args: [input.resourceId],
    });

    return { success: true };
}
exports.nestedMemberExpressionChildWorkflowsWorkflow = nestedMemberExpressionChildWorkflowsWorkflow;




