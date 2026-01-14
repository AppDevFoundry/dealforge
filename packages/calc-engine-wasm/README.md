# DealForge Calculation Engine - WASM Bindings

WebAssembly bindings for the DealForge calculation engine.

## Overview

This package provides JavaScript/TypeScript bindings for the Rust calculation
engine, allowing it to run in browsers and Node.js environments.

## Building

### Prerequisites

- Rust 1.75+ with wasm32-unknown-unknown target
- wasm-pack: `cargo install wasm-pack`

### Build Commands

```bash
# Build for browser (ES modules)
wasm-pack build --target web

# Build for Node.js
wasm-pack build --target nodejs

# Build for bundlers (webpack, etc.)
wasm-pack build --target bundler
```

## Usage in Next.js

```typescript
// lib/calc/rental.ts
import init, { calculate_rental } from '@dealforge/calc-engine-wasm';

let wasmInitialized = false;

async function ensureWasm() {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export async function calculateRental(inputs: RentalInputs): Promise<RentalResults> {
  await ensureWasm();

  const rustInputs = {
    purchase_price: inputs.purchasePrice,
    closing_costs: inputs.closingCosts,
    // ... convert to snake_case
  };

  const resultJson = calculate_rental(JSON.stringify(rustInputs));
  const rustResult = JSON.parse(resultJson);

  return {
    cashOnCashReturn: rustResult.cash_on_cash_return,
    capRate: rustResult.cap_rate,
    // ... convert to camelCase
  };
}
```

## Project Structure

```
src/
└── lib.rs          # wasm-bindgen exports

pkg/                # Generated WASM package (git-ignored)
├── package.json
├── calc_engine_wasm.js
├── calc_engine_wasm.d.ts
└── calc_engine_wasm_bg.wasm
```

## Next.js Configuration

Add WASM support to `next.config.ts`:

```typescript
const nextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};
```

## Performance

WASM calculations run client-side, providing:

- **Instant feedback**: No network round-trip for calculations
- **Offline support**: Works without internet connection
- **Reduced server load**: Computation happens in browser

## License

MIT License - See [LICENSE](../../LICENSE)
