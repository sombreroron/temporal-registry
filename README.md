# temporal-registry

[![CI](https://github.com/sombreroron/temporal-registry/actions/workflows/ci.yml/badge.svg)](https://github.com/sombreroron/temporal-registry/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/temporal-registry.svg)](https://www.npmjs.com/package/temporal-registry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for managing Temporal workflow and activity registries with automatic metadata extraction and validation.

## Features

- 🔍 **Automatic Dependency Detection**: Analyzes workflow files to extract activity and child workflow dependencies
- 🏷️ **Metadata Decorators**: Use decorators to define activity input/output schemas with validation
- ✅ **Validation Support**: Built-in integration with `class-validator` for runtime validation
- 📊 **Registry Management**: Centralized registry for workflows and activities with dependency mapping

## Installation

```bash
npm install temporal-registry
```

## Usage

### Initialize Registry

```typescript
import { initRegistry } from 'temporal-registry';

const registry = await initRegistry({
  workflowsPath: './src/workflows',
  activitiesPath: './src/activities'
});
```

### Activity Metadata Decorators

```typescript
import { 
  ActivityInput, 
  ActivityOutput, 
  ActivityProperty 
} from 'temporal-registry';
import { IsString, IsNumber } from 'class-validator';

@ActivityInput()
class MyActivityInput {
  @ActivityProperty()
  @IsString()
  name: string;

  @ActivityProperty()
  @IsNumber()
  age: number;
}

@ActivityOutput()
class MyActivityOutput {
  @ActivityProperty()
  @IsString()
  message: string;
}

export async function myActivity(input: MyActivityInput): Promise<MyActivityOutput> {
  return { message: `Hello ${input.name}, age ${input.age}` };
}
```

### Extract Workflow Dependencies

```typescript
import { mapWorkflowDependencies } from 'temporal-registry';

const dependencies = await mapWorkflowDependencies('./src/workflows/my-workflow.ts');
console.log(dependencies.activities); // ['myActivity', 'anotherActivity']
console.log(dependencies.childWorkflows); // ['childWorkflow']
```

## API Reference

### `initRegistry(options)`
Initialize the temporal registry with workflow and activity paths.

### `mapWorkflowDependencies(workflowPath)`
Analyze a workflow file and extract all activity and child workflow dependencies.

### `extractActivityMetadata(activityFunction)`
Extract input/output metadata from an activity function decorated with metadata decorators.

### Decorators
- `@ActivityInput()` - Mark a class as an activity input schema
- `@ActivityOutput()` - Mark a class as an activity output schema
- `@ActivityProperty()` - Mark a property as part of the schema
- `@ActivityPropertyOptional()` - Mark a property as optional

## Building

```bash
npm run build
```

## Testing

```bash
npm test
```

## Publishing

The package is configured with `prepublishOnly` hooks to ensure tests pass and the build is up to date before publishing:

```bash
npm publish
```

## License

MIT

