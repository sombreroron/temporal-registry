"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.childWorkflowFromParentClass = void 0;
const workflow_1 = require("@temporalio/workflow");

// Simulating a parent class with executeChildOperation
// In real code, this would be imported from @elementor/temporal-workflow
class OperationWorkflow {
    async executeChildOperation(params) {
        return (0, workflow_1.executeChild)(params.type, {
            taskQueue: params.taskQueue,
            args: [params.input],
        });
    }
}

// Child class that calls parent's executeChildOperation
class ChildWorkflowFromParentClass extends OperationWorkflow {
    async run(params) {
        const { instanceId, backupId, exportPath } = params;

        try {
            const [exportFilesResult, exportDbResult] = await Promise.all([
                this.executeChildOperation({
                    taskQueue: "fs-service",
                    type: "exportFilesWorkflow",
                    input: {
                        exportPath,
                        storageName: "storage1",
                        contentDir: "/content",
                    },
                }),
                this.executeChildOperation({
                    taskQueue: "db-api",
                    type: "exportDbWorkflow",
                    input: {
                        exportPath,
                        dbHost: "localhost",
                        dbName: "mydb",
                    },
                }),
            ]);

            return { exportFilesResult, exportDbResult };
        } catch (e) {
            await this.executeChildOperation({
                taskQueue: "sites-backup",
                type: "deleteBackupWorkflow",
                input: {
                    backupId,
                    instanceId,
                },
            });
            throw e;
        }
    }
}

exports.childWorkflowFromParentClass = ChildWorkflowFromParentClass;

