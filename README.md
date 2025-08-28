# PGLite Bun Segmentation Fault Reproduction

## Usage

### Install dependencies

```bash
bun install
```

### Run repeater

```bash
bun run index.ts
```

Executes up to 10 attempts with 20-second timeout per attempt. Stops immediately upon first segfault.

### Run single test

```bash
bun run execute.ts
```

## How it works

The segfault is triggered through:

1. **Rapid PGLite instance creation** - Creates 1000+ database instances simultaneously
2. **Extreme memory allocation** - Each instance attempts 50MB+ memory allocation
3. **WASM boundary violation** - Overwhelms WebAssembly memory management
4. **NULL pointer dereference** - Results in segmentation fault at address 0x0

