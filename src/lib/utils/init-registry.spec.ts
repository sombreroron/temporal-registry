import { Worker } from "@temporalio/worker";
import { initRegistry } from "./init-registry";

describe("Init Registry", () => {
    it("should initialize the registry", () => {
        const { registryService } = initRegistry("test-service");

        Worker.create({
            taskQueue: "test-queue",
            workflowsPath: require.resolve("../mocks/workflows"),
            activities: {
                testActivity: async () => {
                    return "test";
                },
                anotherTestActivity: async () => {
                    return "another";
                },
            },
        }).catch();

        const components = registryService.getComponents();

        expect(components.activities).toEqual([
            { name: "testActivity", taskQueue: "test-queue", input: [] },
            { name: "anotherTestActivity", taskQueue: "test-queue", input: [] },
        ]);
        expect(components.workflows).toEqual([
            {
                name: "testBaseClassWorkflow",
                activities: [
                    { name: "baseActivity1", taskQueue: "base-activities" },
                    { name: "baseActivity2", taskQueue: "base-activities" },
                    { name: "baseActivity3", taskQueue: "base-activities" },
                    { name: "baseActivity4", taskQueue: "base-activities" },
                    { name: "baseActivity5", taskQueue: "base-activities" },
                    { name: "baseActivity6", taskQueue: "base-activities" },
                    { name: "baseActivity7", taskQueue: "base-activities" },
                    { name: "childActivity1", taskQueue: "child-activities" },
                    { name: "childActivity2", taskQueue: "child-activities" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "childWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "myChildWorkflow", taskQueue: "child-task-queue" },
                    { name: "anotherChildWorkflow", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "MyClassWorkflow",
                activities: [
                    { name: "classActivity1", taskQueue: "test-queue" },
                    { name: "classActivity2", taskQueue: "test-queue" },
                    { name: "remoteClassActivity", taskQueue: "remote-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "classInstantiationWorkflow",
                activities: [
                    { name: "loadData", taskQueue: "WORKFLOW_TASK_QUEUE" },
                    { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "startB", taskQueue: "TASK_QUEUE_B" },
                    { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "dotNotationActivitiesWorkflow",
                activities: [
                    { name: "importDb", taskQueue: "test-queue" },
                    { name: "exportDb", taskQueue: "test-queue" },
                    { name: "processData", taskQueue: "remote-task-queue" },
                    { name: "sendNotification", taskQueue: "remote-task-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "mixedSignatureWrapperWorkflow",
                activities: [],
                childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
                taskQueue: "test-queue",
            },
            {
                name: "dynamicHandlerWorkflow",
                activities: [
                    { name: "aggregateData", taskQueue: "MAIN_TASK_QUEUE" },
                    { name: "getAvailableItems", taskQueue: "MAIN_TASK_QUEUE" },
                    { name: "fetchEntities", taskQueue: "DATA_TASK_QUEUE" },
                    { name: "startB", taskQueue: "TASK_QUEUE_B" },
                    { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                    { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "localActivitiesWorkflow",
                activities: [
                    { name: "localActivity1", taskQueue: "test-queue" },
                    { name: "localActivity2", taskQueue: "test-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "memberExpressionChildWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "deleteInstanceResources", taskQueue: "resource-task-queue" },
                    { name: "instanceBackup", taskQueue: "backup-task-queue" },
                    { name: "httpRulesDelete", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "childWorkflowWithDotName",
                activities: [],
                childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
                taskQueue: "test-queue",
            },
            {
                name: "memberExpressionNonConstantWorkflow",
                activities: [],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "MethodChildWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "testWorkflow", taskQueue: "test-queue" },
                    { name: "anotherTestWorkflow", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "mixedActivitiesWorkflow",
                activities: [
                    { name: "myActivity", taskQueue: "test-queue" },
                    { name: "myOtherActivity", taskQueue: "test-queue" },
                    { name: "myLocalActivity", taskQueue: "test-queue" },
                    { name: "myOtherLocalActivity", taskQueue: "test-queue" },
                    { name: "myRemoteTaskActivity", taskQueue: "remote-task-queue" },
                    { name: "myOtherRemoteTaskActivity", taskQueue: "remote-task-queue" },
                    { name: "myRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                    { name: "mySecondRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "mixedQueuesWorkflow",
                activities: [
                    { name: "defaultActivity", taskQueue: "test-queue" },
                    { name: "queueActivity1", taskQueue: "queue-1" },
                    { name: "queueActivity2", taskQueue: "queue-2" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            { name: "WORKFLOW_TYPES", activities: [], childWorkflows: [], taskQueue: "test-queue" },
            {
                name: "nestedMemberExpressionChildWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "deleteResource", taskQueue: "resource-queue" },
                    { name: "backupResource", taskQueue: "backup-queue" },
                ],
                taskQueue: "test-queue",
            },
            { name: "noActivitiesWorkflow", activities: [], childWorkflows: [], taskQueue: "test-queue" },
            {
                name: "childWorkflowFromParentClass",
                activities: [],
                childWorkflows: [
                    { name: "exportFilesWorkflow", taskQueue: "fs-service" },
                    { name: "exportDbWorkflow", taskQueue: "db-api" },
                    { name: "deleteBackupWorkflow", taskQueue: "sites-backup" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "remoteActivitiesWorkflow",
                activities: [
                    { name: "remoteActivity1", taskQueue: "remote-queue" },
                    { name: "remoteActivity2", taskQueue: "remote-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "wrappedOptionsWorkflow",
                activities: [
                    { name: "submitResult", taskQueue: "task-runner-queue" },
                    { name: "processData", taskQueue: "TASK_RUNNER_QUEUE" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "promiseAllWrapperWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "testChildWorkflow1", taskQueue: "test-queue-1" },
                    { name: "testChildWorkflow2", taskQueue: "test-queue-2" },
                ],
                taskQueue: "test-queue",
            },
        ]);
    });

    it("should initialize the registry when workflow path is a file name", () => {
        const { registryService } = initRegistry("test-service");

        Worker.create({
            taskQueue: "test-queue",
            workflowsPath: require.resolve("../mocks/workflows/index.js"),
            activities: {
                testActivity: async () => {
                    return "test";
                },
                anotherTestActivity: async () => {
                    return "another";
                },
            },
        }).catch();

        const components = registryService.getComponents();

        expect(components.activities).toEqual([
            { name: "testActivity", taskQueue: "test-queue", input: [] },
            { name: "anotherTestActivity", taskQueue: "test-queue", input: [] },
        ]);
        expect(components.workflows).toEqual([
            {
                name: "testBaseClassWorkflow",
                activities: [
                    { name: "baseActivity1", taskQueue: "base-activities" },
                    { name: "baseActivity2", taskQueue: "base-activities" },
                    { name: "baseActivity3", taskQueue: "base-activities" },
                    { name: "baseActivity4", taskQueue: "base-activities" },
                    { name: "baseActivity5", taskQueue: "base-activities" },
                    { name: "baseActivity6", taskQueue: "base-activities" },
                    { name: "baseActivity7", taskQueue: "base-activities" },
                    { name: "childActivity1", taskQueue: "child-activities" },
                    { name: "childActivity2", taskQueue: "child-activities" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "childWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "myChildWorkflow", taskQueue: "child-task-queue" },
                    { name: "anotherChildWorkflow", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "MyClassWorkflow",
                activities: [
                    { name: "classActivity1", taskQueue: "test-queue" },
                    { name: "classActivity2", taskQueue: "test-queue" },
                    { name: "remoteClassActivity", taskQueue: "remote-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "classInstantiationWorkflow",
                activities: [
                    { name: "loadData", taskQueue: "WORKFLOW_TASK_QUEUE" },
                    { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "startB", taskQueue: "TASK_QUEUE_B" },
                    { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "dotNotationActivitiesWorkflow",
                activities: [
                    { name: "importDb", taskQueue: "test-queue" },
                    { name: "exportDb", taskQueue: "test-queue" },
                    { name: "processData", taskQueue: "remote-task-queue" },
                    { name: "sendNotification", taskQueue: "remote-task-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "mixedSignatureWrapperWorkflow",
                activities: [],
                childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
                taskQueue: "test-queue",
            },
            {
                name: "dynamicHandlerWorkflow",
                activities: [
                    { name: "aggregateData", taskQueue: "MAIN_TASK_QUEUE" },
                    { name: "getAvailableItems", taskQueue: "MAIN_TASK_QUEUE" },
                    { name: "fetchEntities", taskQueue: "DATA_TASK_QUEUE" },
                    { name: "startB", taskQueue: "TASK_QUEUE_B" },
                    { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                    { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "localActivitiesWorkflow",
                activities: [
                    { name: "localActivity1", taskQueue: "test-queue" },
                    { name: "localActivity2", taskQueue: "test-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "memberExpressionChildWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "deleteInstanceResources", taskQueue: "resource-task-queue" },
                    { name: "instanceBackup", taskQueue: "backup-task-queue" },
                    { name: "httpRulesDelete", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "childWorkflowWithDotName",
                activities: [],
                childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
                taskQueue: "test-queue",
            },
            {
                name: "memberExpressionNonConstantWorkflow",
                activities: [],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "MethodChildWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "testWorkflow", taskQueue: "test-queue" },
                    { name: "anotherTestWorkflow", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "mixedActivitiesWorkflow",
                activities: [
                    { name: "myActivity", taskQueue: "test-queue" },
                    { name: "myOtherActivity", taskQueue: "test-queue" },
                    { name: "myLocalActivity", taskQueue: "test-queue" },
                    { name: "myOtherLocalActivity", taskQueue: "test-queue" },
                    { name: "myRemoteTaskActivity", taskQueue: "remote-task-queue" },
                    { name: "myOtherRemoteTaskActivity", taskQueue: "remote-task-queue" },
                    { name: "myRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                    { name: "mySecondRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "mixedQueuesWorkflow",
                activities: [
                    { name: "defaultActivity", taskQueue: "test-queue" },
                    { name: "queueActivity1", taskQueue: "queue-1" },
                    { name: "queueActivity2", taskQueue: "queue-2" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            { name: "WORKFLOW_TYPES", activities: [], childWorkflows: [], taskQueue: "test-queue" },
            {
                name: "nestedMemberExpressionChildWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "deleteResource", taskQueue: "resource-queue" },
                    { name: "backupResource", taskQueue: "backup-queue" },
                ],
                taskQueue: "test-queue",
            },
            { name: "noActivitiesWorkflow", activities: [], childWorkflows: [], taskQueue: "test-queue" },
            {
                name: "childWorkflowFromParentClass",
                activities: [],
                childWorkflows: [
                    { name: "exportFilesWorkflow", taskQueue: "fs-service" },
                    { name: "exportDbWorkflow", taskQueue: "db-api" },
                    { name: "deleteBackupWorkflow", taskQueue: "sites-backup" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "remoteActivitiesWorkflow",
                activities: [
                    { name: "remoteActivity1", taskQueue: "remote-queue" },
                    { name: "remoteActivity2", taskQueue: "remote-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "wrappedOptionsWorkflow",
                activities: [
                    { name: "submitResult", taskQueue: "task-runner-queue" },
                    { name: "processData", taskQueue: "TASK_RUNNER_QUEUE" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "promiseAllWrapperWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "testChildWorkflow1", taskQueue: "test-queue-1" },
                    { name: "testChildWorkflow2", taskQueue: "test-queue-2" },
                ],
                taskQueue: "test-queue",
            },
        ]);
    });

    it("should return a serverAdapter which can be used to fetch the components", async () => {
        const { registryServerAdapter } = initRegistry("test-service");

        Worker.create({
            taskQueue: "test-queue",
            workflowsPath: require.resolve("../mocks/workflows"),
            activities: {
                testActivity: async () => {
                    return "test";
                },
            },
        }).catch();

        const response = await registryServerAdapter.fetch("/", {
            method: "GET",
            headers: {},
        });

        const body = await response.json();

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("application/json");

        expect(body.components.activities).toEqual([{ name: "testActivity", taskQueue: "test-queue", input: [] }]);
        expect(body.components.workflows).toEqual([
            {
                name: "testBaseClassWorkflow",
                activities: [
                    { name: "baseActivity1", taskQueue: "base-activities" },
                    { name: "baseActivity2", taskQueue: "base-activities" },
                    { name: "baseActivity3", taskQueue: "base-activities" },
                    { name: "baseActivity4", taskQueue: "base-activities" },
                    { name: "baseActivity5", taskQueue: "base-activities" },
                    { name: "baseActivity6", taskQueue: "base-activities" },
                    { name: "baseActivity7", taskQueue: "base-activities" },
                    { name: "childActivity1", taskQueue: "child-activities" },
                    { name: "childActivity2", taskQueue: "child-activities" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "childWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "myChildWorkflow", taskQueue: "child-task-queue" },
                    { name: "anotherChildWorkflow", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "MyClassWorkflow",
                activities: [
                    { name: "classActivity1", taskQueue: "test-queue" },
                    { name: "classActivity2", taskQueue: "test-queue" },
                    { name: "remoteClassActivity", taskQueue: "remote-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "classInstantiationWorkflow",
                activities: [
                    { name: "loadData", taskQueue: "WORKFLOW_TASK_QUEUE" },
                    { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "startB", taskQueue: "TASK_QUEUE_B" },
                    { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "dotNotationActivitiesWorkflow",
                activities: [
                    { name: "importDb", taskQueue: "test-queue" },
                    { name: "exportDb", taskQueue: "test-queue" },
                    { name: "processData", taskQueue: "remote-task-queue" },
                    { name: "sendNotification", taskQueue: "remote-task-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "mixedSignatureWrapperWorkflow",
                activities: [],
                childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
                taskQueue: "test-queue",
            },
            {
                name: "dynamicHandlerWorkflow",
                activities: [
                    { name: "aggregateData", taskQueue: "MAIN_TASK_QUEUE" },
                    { name: "getAvailableItems", taskQueue: "MAIN_TASK_QUEUE" },
                    { name: "fetchEntities", taskQueue: "DATA_TASK_QUEUE" },
                    { name: "startB", taskQueue: "TASK_QUEUE_B" },
                    { name: "stopB", taskQueue: "TASK_QUEUE_B" },
                    { name: "activateA", taskQueue: "TASK_QUEUE_A" },
                    { name: "deactivateA", taskQueue: "TASK_QUEUE_A" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "localActivitiesWorkflow",
                activities: [
                    { name: "localActivity1", taskQueue: "test-queue" },
                    { name: "localActivity2", taskQueue: "test-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "memberExpressionChildWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "deleteInstanceResources", taskQueue: "resource-task-queue" },
                    { name: "instanceBackup", taskQueue: "backup-task-queue" },
                    { name: "httpRulesDelete", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "childWorkflowWithDotName",
                activities: [],
                childWorkflows: [{ name: "testChildWorkflow", taskQueue: "test-queue" }],
                taskQueue: "test-queue",
            },
            {
                name: "memberExpressionNonConstantWorkflow",
                activities: [],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "MethodChildWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "testWorkflow", taskQueue: "test-queue" },
                    { name: "anotherTestWorkflow", taskQueue: "test-queue" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "mixedActivitiesWorkflow",
                activities: [
                    { name: "myActivity", taskQueue: "test-queue" },
                    { name: "myOtherActivity", taskQueue: "test-queue" },
                    { name: "myLocalActivity", taskQueue: "test-queue" },
                    { name: "myOtherLocalActivity", taskQueue: "test-queue" },
                    { name: "myRemoteTaskActivity", taskQueue: "remote-task-queue" },
                    { name: "myOtherRemoteTaskActivity", taskQueue: "remote-task-queue" },
                    { name: "myRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                    { name: "mySecondRemoteTaskActivity", taskQueue: "second-remote-task-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "mixedQueuesWorkflow",
                activities: [
                    { name: "defaultActivity", taskQueue: "test-queue" },
                    { name: "queueActivity1", taskQueue: "queue-1" },
                    { name: "queueActivity2", taskQueue: "queue-2" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            { name: "WORKFLOW_TYPES", activities: [], childWorkflows: [], taskQueue: "test-queue" },
            {
                name: "nestedMemberExpressionChildWorkflowsWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "deleteResource", taskQueue: "resource-queue" },
                    { name: "backupResource", taskQueue: "backup-queue" },
                ],
                taskQueue: "test-queue",
            },
            { name: "noActivitiesWorkflow", activities: [], childWorkflows: [], taskQueue: "test-queue" },
            {
                name: "childWorkflowFromParentClass",
                activities: [],
                childWorkflows: [
                    { name: "exportFilesWorkflow", taskQueue: "fs-service" },
                    { name: "exportDbWorkflow", taskQueue: "db-api" },
                    { name: "deleteBackupWorkflow", taskQueue: "sites-backup" },
                ],
                taskQueue: "test-queue",
            },
            {
                name: "remoteActivitiesWorkflow",
                activities: [
                    { name: "remoteActivity1", taskQueue: "remote-queue" },
                    { name: "remoteActivity2", taskQueue: "remote-queue" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "wrappedOptionsWorkflow",
                activities: [
                    { name: "submitResult", taskQueue: "task-runner-queue" },
                    { name: "processData", taskQueue: "TASK_RUNNER_QUEUE" },
                ],
                childWorkflows: [],
                taskQueue: "test-queue",
            },
            {
                name: "promiseAllWrapperWorkflow",
                activities: [],
                childWorkflows: [
                    { name: "testChildWorkflow1", taskQueue: "test-queue-1" },
                    { name: "testChildWorkflow2", taskQueue: "test-queue-2" },
                ],
                taskQueue: "test-queue",
            },
        ]);
    });
});
