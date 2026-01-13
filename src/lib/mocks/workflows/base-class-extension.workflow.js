"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testBaseClassWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");
const mock_operation_base_1 = require("../mock-base.class");

// Test workflow that extends the base class
class TestBaseClassWorkflow extends mock_operation_base_1.MockBaseWorkflow {
    async run(params) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { instanceId } = params;
            
            // These activities should be detected from the child class
            yield childActivity1(instanceId);
            yield childActivity2(instanceId);
            
            return { success: true };
        });
    }
}

// Activities defined in the child workflow file
const { childActivity1, childActivity2 } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "child-activities",
    retry: {
        maximumAttempts: 3,
    },
});

exports.testBaseClassWorkflow = TestBaseClassWorkflow;
//# sourceMappingURL=base-class-extension.workflow.js.map

