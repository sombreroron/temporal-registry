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
npm install temporal-registry reflect-metadata
```

### TypeScript Configuration

To use the metadata decorators, you need to enable experimental decorators in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

You also need to import `reflect-metadata` at the entry point of your application (before any decorators are used):

```typescript
import 'reflect-metadata';
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

## Limitations

### Activity Metadata Extraction

- **Nested Object Depth**: Complex nested objects are only introspected one level deep. Properties of nested classes are extracted, but deeply nested structures (e.g., objects within objects within objects) may lose type information beyond the first level.

- **Array Element Types**: Arrays without explicit type annotations using `@ActivityProperty({ type: [ElementType] })` will be recognized as `Array` type but without element type information. Always use the explicit type syntax for typed arrays.

- **Primitive Type Coverage**: Only the following primitive types are explicitly recognized:
  - `String`, `Number`, `Boolean`
  - `BigInt`, `Symbol`
  - `Date`, `RegExp`, `Error`
  - Other types (e.g., `Map`, `Set`, typed tuples, `WeakMap`, `WeakSet`) are not automatically detected

- **Design-time Type Information**: The metadata extraction works at runtime but depends on design-time type information emitted by TypeScript. Complex types like union types, intersection types, or generic types may not be fully represented in the extracted metadata.

## License

MIT

