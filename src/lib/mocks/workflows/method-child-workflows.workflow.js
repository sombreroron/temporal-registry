"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodChildWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");

// Method-style executeChild call with options object
class MethodChildWorkflow {
    async run(input) {
        // Method call with type in options object
        await this.executeChild({
            type: "testWorkflow",
            taskQueue: "test-queue",
            input: input,
        });

        // Another method call - taskQueue is dynamic so should be undefined
        await this.executeChild({
            type: "anotherTestWorkflow",
            input: input,
        });

        return { success: true };
    }

    async executeChild(params) {
        // This would be the actual implementation that calls workflow.executeChild
        return (0, workflow_1.executeChild)(params.type, {
            taskQueue: params.taskQueue,
            args: [params.input],
        });
    }
}
exports.MethodChildWorkflow = MethodChildWorkflow;
