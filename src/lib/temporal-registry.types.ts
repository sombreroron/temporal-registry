interface PropertyMetadata {
    name: string;
    type: string;
}

interface ClassMetadata {
    className: string;
    properties: PropertyMetadata[];
}

export interface ActivityComponent {
    name: string;
    taskQueue?: string;
    input?: ClassMetadata;
    output?: ClassMetadata;
}

export interface ChildWorkflowComponent {
    name?: string;
    taskQueue?: string;
}

export interface WorkflowComponent {
    name?: string;
    activities: ActivityComponent[];
    childWorkflows: ChildWorkflowComponent[];
    taskQueue?: string;
}

export interface RegistryComponents {
    activities: ActivityComponent[];
    workflows: WorkflowComponent[];
}
