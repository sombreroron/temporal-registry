"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixedQueuesWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");
const { defaultActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
});
const { queueActivity1 } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "queue-1",
});
const { queueActivity2 } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "queue-2",
});
function mixedQueuesWorkflow() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield defaultActivity();
        yield queueActivity1();
        yield queueActivity2();
    });
}
exports.mixedQueuesWorkflow = mixedQueuesWorkflow;
//# sourceMappingURL=mixed-queues.workflow.js.map