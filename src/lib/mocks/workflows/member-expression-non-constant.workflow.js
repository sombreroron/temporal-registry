"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memberExpressionNonConstantWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");

// This workflow should NOT extract "type" as a child workflow
// because params is not a constant
async function memberExpressionNonConstantWorkflow(params) {
    // This should NOT be detected as params is a function parameter, not a constant
    await (0, workflow_1.executeChild)(params.type, {
        taskQueue: "test-queue",
        args: [params.input],
    });

    return { success: true };
}
exports.memberExpressionNonConstantWorkflow = memberExpressionNonConstantWorkflow;




