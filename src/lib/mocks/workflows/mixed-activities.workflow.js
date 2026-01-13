"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mixedActivitiesWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");
const { myActivity, myOtherActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
});
const { myLocalActivity, myOtherLocalActivity } = (0, workflow_1.proxyLocalActivities)({
    startToCloseTimeout: "10 sec",
});
const { myRemoteTaskActivity, myOtherRemoteTaskActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "remote-task-queue",
});
const mySecondRemoteTaskQueue = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "second-remote-task-queue",
});
function mixedActivitiesWorkflow() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield myActivity();
        yield myOtherActivity();
        yield myLocalActivity();
        yield myOtherLocalActivity();
        yield myRemoteTaskActivity();
        yield myOtherRemoteTaskActivity();
        yield mySecondRemoteTaskQueue["myRemoteTaskActivity"]();
        const { mySecondRemoteTaskActivity } = mySecondRemoteTaskQueue;
        yield mySecondRemoteTaskActivity();
    });
}
exports.mixedActivitiesWorkflow = mixedActivitiesWorkflow;
//# sourceMappingURL=mixed-activities.workflow.js.map