"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseAllWrapperWorkflow = void 0;
const workflow_1 = require("@temporalio/workflow");

// Workflow that uses executeChildOperation wrapper method in Promise.all
class PromiseAllWrapperWorkflow {
    async run(input) {
        const [result1, result2] = await Promise.all([
            this.executeChildOperation({
                taskQueue: "test-queue-1",
                type: "testChildWorkflow1",
                input: {
                    data: input.data1,
                },
            }),
            this.executeChildOperation({
                taskQueue: "test-queue-2",
                type: "testChildWorkflow2",
                input: {
                    data: input.data2,
                },
            }),
        ]);

        return { result1, result2 };
    }

    // Wrapper method that internally calls executeChild
    async executeChildOperation(params) {
        return (0, workflow_1.executeChild)(params.type, {
            taskQueue: params.taskQueue,
            args: [params.input],
        });
    }
}

exports.promiseAllWrapperWorkflow = PromiseAllWrapperWorkflow;


