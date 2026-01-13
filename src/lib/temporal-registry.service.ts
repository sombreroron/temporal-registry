import { RegistryComponents } from "./temporal-registry.types";
import { mapWorkflowDependencies } from "./utils/map-workflow-dependencies";
import * as fs from "node:fs";
import * as path from "node:path";
import { extractActivityMetadata } from "./utils/extract-activity-metadata";

export class TemporalRegistryService {
    private components: RegistryComponents = { activities: [], workflows: [] };

    registerActivities(activities: any, taskQueue?: string) {
        for (const activityName of Object.keys(activities)) {
            const metadata = extractActivityMetadata(activities[activityName]);
            this.components.activities.push({
                name: activityName,
                taskQueue,
                output: metadata.output as any,
                input: metadata.input as any,
            });
        }
    }

    registerWorkflows(workflowPath: string, taskQueue: string) {
        const workflowFiles = this.getWorkflowFiles(workflowPath);
        const workflowComponents = workflowFiles.map((workflowPath) => ({
            ...mapWorkflowDependencies(workflowPath, taskQueue),
            taskQueue,
        }));

        this.components.workflows.push(...workflowComponents);
    }

    getComponents(): RegistryComponents {
        return this.components;
    }

    private getWorkflowFiles(workflowPath: string): string[] {
        const dirPath = path.dirname(workflowPath);
        const files = fs
            .readdirSync(dirPath)
            .filter((file) => {
                const fullPath = path.join(dirPath, file);
                const stat = fs.statSync(fullPath);
                return (
                    stat.isFile() &&
                    !/^index\.(t|j)s?$/.test(file) &&
                    !/\.d\.ts$/.test(file) &&
                    !/\.js\.map$/.test(file)
                );
            })
            .map((file) => path.join(dirPath, file));

        return files;
    }
}
