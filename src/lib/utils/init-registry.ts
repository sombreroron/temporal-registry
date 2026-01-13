import { Worker, WorkerOptions } from "@temporalio/worker";
import { createServerAdapter } from "@whatwg-node/server";
import * as packageJson from "../../../package.json";
import { TemporalRegistryService } from "../temporal-registry.service";

export function initRegistry(serviceName: string) {
    const originalWorkerCreate = Worker.create;
    const registryService = new TemporalRegistryService();
    const registryServerAdapter = createServerAdapter(() => {
        return new Response(
            JSON.stringify({
                serviceName,
                temporalRegistry: packageJson.version,
                components: registryService.getComponents(),
            }),
            {
                status: 200,
                headers: { "content-type": "application/json" },
            },
        );
    });

    Worker.create = async function (options: WorkerOptions): Promise<Worker> {
        const { taskQueue, activities = {}, workflowsPath } = options;

        registryService.registerActivities(activities, taskQueue);

        if (workflowsPath) {
            registryService.registerWorkflows(workflowsPath, taskQueue);
        }

        return originalWorkerCreate.call(Worker, options);
    };

    return { registryService, registryServerAdapter };
}
