# DealForge Calculation Engine

A pure Rust library for real estate investment calculations.

## Overview

This library contains all the core financial calculations for DealForge:

- **Rental Property Analysis**: Cash flow, ROI, cap rate, cash-on-cash return
- **BRRRR Calculations**: Buy-Rehab-Rent-Refinance-Repeat modeling
- **Flip/Rehab Analysis**: ARV, profit projections, ROI
- **Multi-family Analysis**: NOI, DSCR, expense ratios
- **Syndication Modeling**: Waterfall distributions, LP/GP splits, IRR

## Why Rust?

1. **Correctness**: Strong type system catches errors at compile time
2. **Performance**: Near-native speed for complex calculations
3. **Cross-platform**: Same code runs in browser (WASM), server, and iOS
4. **Auditability**: Pure functions are easy to test and verify

## Project Structure

```
src/
├── lib.rs              # Library entry point
├── common/             # Shared calculation logic
│   ├── mod.rs
│   ├── amortization.rs # Loan amortization schedules
│   ├── time_value.rs   # NPV, IRR, discounting
│   ├── metrics.rs      # ROI, cap rate, etc.
│   └── cashflow.rs     # Cash flow modeling
├── rental.rs           # Rental property calculator
├── brrrr.rs            # BRRRR calculator
├── flip.rs             # Flip calculator
├── multifamily.rs      # Multi-family calculator
└── syndication.rs      # Syndication waterfall
```

## Getting Started

### Prerequisites

- Rust 1.75+ (install via [rustup](https://rustup.rs/))
- wasm-pack (for WASM builds): `cargo install wasm-pack`

### Development

```bash
# Run tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Check for errors
cargo check

# Build
cargo build --release
```

## Usage

This library is consumed via the `calc-engine-wasm` package which provides
JavaScript/TypeScript bindings for use in the browser and Node.js.

See [packages/calc-engine-wasm](../calc-engine-wasm) for integration details.

## Testing

All calculations include comprehensive test coverage:

```bash
# Run all tests
cargo test

# Run specific test module
cargo test rental

# Run with verbose output
cargo test -- --nocapture
```

## Contributing

When adding new calculators:

1. Create a new module in `src/`
2. Define input/output structs with Serde derives
3. Implement the calculation logic as pure functions
4. Add comprehensive unit tests
5. Export from `lib.rs`
6. Add WASM bindings in `calc-engine-wasm`

## License

MIT License - See [LICENSE](../../LICENSE)
