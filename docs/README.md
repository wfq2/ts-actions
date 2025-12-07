# Documentation

This directory contains the documentation for ts-actions, built with [MkDocs](https://www.mkdocs.org/) and the [Material theme](https://squidfunk.github.io/mkdocs-material/).

## Building the Documentation

### Prerequisites

Install MkDocs and the Material theme:

```bash
pip install -r requirements.txt
```

### Build Commands

Build the documentation site:

```bash
npm run docs:build
# or
mkdocs build
```

Serve the documentation locally (with auto-reload):

```bash
npm run docs:serve
# or
mkdocs serve
```

The documentation will be available at `http://127.0.0.1:8000`.

### Deploy to GitHub Pages

Deploy the documentation to GitHub Pages:

```bash
npm run docs:deploy
# or
mkdocs gh-deploy
```

## Documentation Structure

- `index.md` - Homepage
- `getting-started/` - Installation and quick start guides
- `api/` - Complete API reference
  - `workflow.md` - Workflow class documentation
  - `job.md` - Job class documentation
  - `step.md` - Step class documentation
  - `helpers.md` - Helper functions
  - `synthesis.md` - Synthesis functions
  - `types.md` - Type definitions
- `examples/` - Code examples
  - `basic.md` - Basic workflow examples
  - `advanced.md` - Advanced patterns and examples

## Contributing

When adding or updating documentation:

1. Edit the appropriate Markdown file in this directory
2. Use code examples with proper syntax highlighting
3. Follow the existing documentation style
4. Test locally with `npm run docs:serve`
5. Ensure all public APIs are documented

