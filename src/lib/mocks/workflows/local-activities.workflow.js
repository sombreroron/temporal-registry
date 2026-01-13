"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localActivitiesWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");
const { localActivity1, localActivity2 } = (0, workflow_1.proxyLocalActivities)({
    startToCloseTimeout: "10 sec",
});
function localActivitiesWorkflow() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield localActivity1();
        yield localActivity2();
    });
}
exports.localActivitiesWorkflow = localActivitiesWorkflow;
//# sourceMappingURL=local-activities.workflow.js.map