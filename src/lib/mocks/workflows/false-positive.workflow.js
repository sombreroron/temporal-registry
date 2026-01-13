"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixedSignatureWrapperWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");

// Workflow that calls wrapper methods with different argument patterns
class MixedSignatureWrapperWorkflow {
    async run(input) {
        // These should NOT be detected as child workflows because they don't have a 'type' property
        const result1 = await this.executeChildOperation(input.instance, input.transferParameters);
        
        // This SHOULD be detected because it has the right signature
        const result2 = await this.executeChildOperation({
            type: "testChildWorkflow",
            taskQueue: "test-queue",
            input: input.data,
        });

        return { result1, result2 };
    }

    // Wrapper method that internally calls executeChild
    async executeChildOperation(...args) {
        // In real code, this might have logic to handle different argument patterns
        if (args.length === 1 && typeof args[0] === 'object' && args[0].type) {
            const params = args[0];
            return (0, workflow_1.executeChild)(params.type, {
                taskQueue: params.taskQueue,
                args: [params.input],
            });
        }
        // Handle other argument patterns (non-workflow calls)
        return { success: false };
    }
}

exports.mixedSignatureWrapperWorkflow = MixedSignatureWrapperWorkflow;

