"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childWorkflowWithDotName = void 0;
const workflow_1 = require("@temporalio/workflow");

// Simulating imported workflow with .name property
const imported_workflow_1 = {
    testChildWorkflow: {
        name: "testChildWorkflow"
    }
};

class OperationWorkflow {
    async executeChildOperation(params) {
        return (0, workflow_1.executeChild)(params.type, {
            taskQueue: params.taskQueue,
            args: [params.input],
        });
    }
}

class ChildWorkflowWithDotName extends OperationWorkflow {
    async run({ instanceId, startDate, endDate, type, traceId }) {
        const rangeBatches = [{startDate: new Date(), endDate: new Date()}];
        
        for (const rangeBatch of rangeBatches) {
            const logs = await this.executeChildOperation({
                type: imported_workflow_1.testChildWorkflow.name,  // Using .name property
                taskQueue: "test-queue",
                input: {
                    instanceId,
                    startDate: rangeBatch.startDate.toISOString(),
                    endDate: rangeBatch.endDate.toISOString(),
                    type,
                    traceId,
                },
                cache: {
                    maxAge: 604800000,
                },
            });
        }
    }
}

exports.childWorkflowWithDotName = ChildWorkflowWithDotName;

