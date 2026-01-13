"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyClassWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");
class MyClassWorkflow {
    constructor() {
        this.activities = (0, workflow_1.proxyActivities)({
            startToCloseTimeout: "10 sec",
        });
        this.remoteActivities = (0, workflow_1.proxyActivities)({
            startToCloseTimeout: "10 sec",
            taskQueue: "remote-queue",
        });
    }
    execute() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const { classActivity1, classActivity2 } = this.activities;
            const { remoteClassActivity } = this.remoteActivities;
            yield classActivity1();
            yield classActivity2();
            yield remoteClassActivity();
        });
    }
}
exports.MyClassWorkflow = MyClassWorkflow;
//# sourceMappingURL=class-based.workflow.js.map