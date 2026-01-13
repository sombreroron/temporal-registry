"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remoteActivitiesWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");
const { remoteActivity1, remoteActivity2 } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "remote-queue",
});
function remoteActivitiesWorkflow() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield remoteActivity1();
        yield remoteActivity2();
    });
}
exports.remoteActivitiesWorkflow = remoteActivitiesWorkflow;
//# sourceMappingURL=remote-activities.workflow.js.map