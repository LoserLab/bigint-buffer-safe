# bigint-buffer-safe

Safe, pure-JS drop-in replacement for [`bigint-buffer`](https://www.npmjs.com/package/bigint-buffer). Fixes [CVE-2025-3194](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg).

## Why?

The original `bigint-buffer` package has a **high-severity buffer overflow vulnerability** (CVSS 7.5) that crashes your process when `toBigIntLE(null)` or other invalid input is passed. The maintainer hasn't published an update since October 2019.

This affects the entire Solana ecosystem through the dependency chain:

```
bigint-buffer → @solana/buffer-layout-utils → @solana/web3.js v1.x → @solana/wallet-adapter-*
```

**bigint-buffer-safe** is a zero-dependency, pure-JavaScript replacement with input validation. No native N-API bindings, no build step required, works in Node.js and browsers.

## Install

```bash
npm install bigint-buffer-safe
```

### As a drop-in replacement (recommended for existing projects)

Add to your `package.json` to replace `bigint-buffer` across your entire dependency tree:

**npm** (v8.3+):
```json
{
  "overrides": {
    "bigint-buffer": "npm:bigint-buffer-safe@^1.0.0"
  }
}
```

**yarn**:
```json
{
  "resolutions": {
    "bigint-buffer": "npm:bigint-buffer-safe@^1.0.0"
  }
}
```

**pnpm**:
```json
{
  "pnpm": {
    "overrides": {
      "bigint-buffer": "npm:bigint-buffer-safe@^1.0.0"
    }
  }
}
```

Then reinstall:

```bash
rm -rf node_modules package-lock.json && npm install
```

## API

Identical to `bigint-buffer@1.1.5`:

```ts
import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from "bigint-buffer-safe";

// Buffer → BigInt
toBigIntBE(Buffer.from([0x01, 0x00])); // 256n
toBigIntLE(Buffer.from([0x00, 0x01])); // 256n

// BigInt → Buffer
toBufferBE(256n, 2); // <Buffer 01 00>
toBufferLE(256n, 2); // <Buffer 00 01>
```

### What's different from the original?

**Input validation.** Invalid input throws a `TypeError` instead of crashing your process:

```ts
// Original bigint-buffer: CRASHES (CVE-2025-3194)
toBigIntLE(null);

// bigint-buffer-safe: throws TypeError
toBigIntLE(null); // TypeError: toBigIntLE: expected a Buffer, got null
```

**No native bindings.** The original ships N-API C++ bindings that fail silently in browsers and bundlers (the infamous `"bigint: Failed to load bindings"` warning). This package is pure JavaScript.

## Benchmarks

Pure JS, no native bindings. Tested on Apple Silicon (M-series), Node.js, 1M iterations each.

| Operation | Size | Ops/sec |
|---|---|---|
| `toBigIntBE` | u64 (8 bytes) | 9,079,934 |
| `toBigIntLE` | u64 (8 bytes) | 6,128,182 |
| `toBigIntBE` | u128 (16 bytes) | 7,018,804 |
| `toBigIntLE` | u128 (16 bytes) | 5,069,809 |
| `toBufferBE` | u64 (8 bytes) | 5,569,161 |
| `toBufferLE` | u64 (8 bytes) | 5,183,747 |
| `toBufferBE` | u128 (16 bytes) | 7,063,305 |
| `toBufferLE` | u128 (16 bytes) | 6,533,752 |

For the u64 and u128 integers used in Solana programs (lamports, token amounts, timestamps), performance is more than sufficient. The original's N-API bindings were faster for very large buffers, but those sizes aren't used in Solana.

Run benchmarks yourself:

```bash
npx tsx bench/index.ts
```

## The long-term fix

This package is a bridge for projects on `@solana/web3.js` v1.x. The permanent solution is migrating to [`@solana/kit`](https://github.com/anza-xyz/kit) (web3.js v2), which has zero external dependencies and doesn't use `bigint-buffer` at all.

## Author

Created by **Heathen**

Built in [Mirra](https://mirra.app)

## License

MIT License

Copyright (c) 2026 Heathen
