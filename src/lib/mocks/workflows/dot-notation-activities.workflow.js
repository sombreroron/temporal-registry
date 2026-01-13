"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dotNotationActivitiesWorkflow = void 0;
const tslib_1 = require("tslib");
const workflow_1 = require("@temporalio/workflow");

// Activities called with dot notation (not destructured)
const dbActivities = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "3600 sec",
    heartbeatTimeout: "120 sec",
    retry: {
        maximumAttempts: 2,
        initialInterval: "3s",
        backoffCoefficient: 2,
    },
});

const remoteActivities = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: "10 sec",
    taskQueue: "remote-task-queue",
});

function dotNotationActivitiesWorkflow(input) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Using dot notation to call activities
        yield dbActivities.importDb(input);
        yield dbActivities.exportDb(input);
        yield remoteActivities.processData(input);
        yield remoteActivities.sendNotification(input);
    });
}
exports.dotNotationActivitiesWorkflow = dotNotationActivitiesWorkflow;

