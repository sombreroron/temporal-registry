"use strict";
// Don't set __esModule to avoid being picked up as a workflow by Temporal
const workflow_1 = require("@temporalio/workflow");

// Mock base class activities - simulates a base workflow class
const { baseActivity1, baseActivity2, baseActivity3, baseActivity4, baseActivity5, baseActivity6, baseActivity7 } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "base-activities",
    retry: {
        maximumAttempts: 4,
    },
});

class MockBaseWorkflow {
    constructor() {
        this.compensation = [];
        const originalRun = this.run;
        this.run = (args) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield baseActivity2((0, workflow_1.workflowInfo)().workflowId, { status: "running" });
            return yield originalRun.call(this, args);
        });
    }
    static create(options) {
        const Workflow = this;
        const fn = function (args) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    const { mutex, concurrencyWindow, metadata } = options || {};
                    const instance = new Workflow();
                    yield instance.createOperation(args, options);
                    if (metadata) {
                        instance.updateSearchAttributes(args, metadata);
                    }
                    if (mutex || concurrencyWindow) {
                        const result = yield instance.enqueue(args, options);
                        yield baseActivity2((0, workflow_1.workflowInfo)().workflowId, { status: "completed", result });
                        return result;
                    }
                    const result = yield instance.run(args);
                    yield baseActivity2((0, workflow_1.workflowInfo)().workflowId, { status: "completed", result });
                    return result;
                }
                catch (e) {
                    yield workflow_1.CancellationScope.nonCancellable(() => baseActivity2((0, workflow_1.workflowInfo)().workflowId, {
                        status: "failed",
                        error: { message: e.message, stack: e.stack, code: e.code },
                    }));
                    if (e instanceof workflow_1.ContinueAsNew) {
                        throw e;
                    }
                    else {
                        throw new common_1.TemporalFailure(e.message, e);
                    }
                }
            });
        };
        return fn;
    }
    async run(args) {
        throw new Error("Abstract method must be implemented");
    }
}

// Export but don't add to exports to avoid being picked up as a workflow by Temporal
module.exports.MockBaseWorkflow = MockBaseWorkflow;

