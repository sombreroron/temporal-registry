# Contributing to temporal-registry

Thank you for your interest in contributing to temporal-registry! Here are some guidelines to help you get started.

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/sombreroron/temporal-registry.git
cd temporal-registry
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Development Workflow

### Building

- `npm run build` - Build the project
- `npm run build:watch` - Build in watch mode
- `npm run clean` - Clean build artifacts

### Testing

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report

### Project Structure

- `src/` - Source code
  - `lib/decorators/` - Activity metadata decorators
  - `lib/utils/` - Utility functions for registry management
  - `lib/temporal-registry.service.ts` - Main registry service
  - `lib/temporal-registry.types.ts` - TypeScript type definitions
- `dist/` - Compiled output (generated)

## Pull Request Process

1. Create a new branch for your feature or bugfix
2. Make your changes
3. Add or update tests as needed
4. Ensure all tests pass: `npm test`
5. Ensure the build succeeds: `npm run build`
6. Submit a pull request with a clear description of your changes

## Code Style

- Use TypeScript
- Follow existing code formatting
- Write clear, descriptive variable and function names
- Add JSDoc comments for public APIs

## Testing

- Write unit tests for new functionality
- Ensure test coverage remains high
- Mock external dependencies appropriately

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub with:
- A clear description of the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (Node version, OS, etc.)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

