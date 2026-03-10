# bigint-buffer-safe

<p align="center">
  <img src="social/heathen-bigint-buffer-safe-card.png" alt="bigint-buffer-safe" width="100%">
</p>

Safe, pure-JS drop-in replacement for [`bigint-buffer`](https://www.npmjs.com/package/bigint-buffer). Fixes [CVE-2025-3194](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg) (CVSS 7.5, buffer overflow / DoS).

Zero dependencies. No native bindings. Works in Node.js and browsers.

## Why does this exist?

The original `bigint-buffer` package has a **high-severity buffer overflow vulnerability** ([CVE-2025-3194](https://github.com/advisories/GHSA-3gc7-fjrx-p6mg), CVSS 7.5) that crashes your process when `toBigIntLE(null)` or other invalid input is passed. The maintainer hasn't published an update since October 2019. The [`@solana/buffer-layout-utils`](https://github.com/solana-labs/buffer-layout-utils) package that depends on it was archived in January 2025. No upstream fix is coming.

This vulnerability affects the entire Solana ecosystem through the transitive dependency chain:

```
bigint-buffer → @solana/buffer-layout-utils → @solana/web3.js v1.x → @solana/wallet-adapter-*
```

**bigint-buffer-safe** is a pure-JavaScript replacement with proper input validation. API-compatible with `bigint-buffer@1.1.5`.

## Install

```bash
npm install bigint-buffer-safe
```

### Drop-in replacement for Solana projects (recommended)

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

**Using GitHub directly** (if not published to npm):
```json
{
  "overrides": {
    "bigint-buffer": "github:LoserLab/bigint-buffer-safe"
  }
}
```

Then reinstall:

```bash
rm -rf node_modules package-lock.json && npm install
```

Verify the vulnerability is resolved:

```bash
npm audit
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

## FAQ

### Who is affected?

Any project using `@solana/web3.js` v1.x (versions 1.43.1 through 1.98.x). Run `npm ls bigint-buffer` to check if it's in your dependency tree.

### Does this affect @solana/kit (web3.js v2)?

No. `@solana/kit` has zero third-party dependencies and does not use `bigint-buffer`. If you've already migrated to Kit, you're not affected.

### What about the "bigint: Failed to load bindings" warning?

That warning comes from `bigint-buffer`'s native N-API bindings failing to load in bundled environments. Replacing with `bigint-buffer-safe` eliminates it since this package is pure JavaScript.

### Is this a permanent fix?

This is a bridge for projects still on `@solana/web3.js` v1.x. The permanent solution is migrating to [`@solana/kit`](https://github.com/anza-xyz/kit), which has zero external dependencies.

### How is this different from bigint-buffer-fixed?

[`bigint-buffer-fixed`](https://www.npmjs.com/package/bigint-buffer-fixed) is another community fork. `bigint-buffer-safe` removes native N-API bindings entirely (eliminating the "Failed to load bindings" warning), includes a full test suite with 64 tests, and provides TypeScript type definitions.

## The long-term fix

This package is a bridge for projects on `@solana/web3.js` v1.x. The permanent solution is migrating to [`@solana/kit`](https://github.com/anza-xyz/kit) (web3.js v2), which has zero external dependencies and doesn't use `bigint-buffer` at all. The Solana Foundation also released [ConnectorKit](https://www.connectorkit.dev/) (`@solana/connector`) as the modern replacement for the wallet adapter ecosystem with dual v1/v2 support.

## Part of the Solana Migration Toolkit

Four tools that work together to get your project from web3.js v1 to Kit v2:

| Tool | What it does |
|------|-------------|
| [solana-deps](https://github.com/LoserLab/solana-deps) | Trace why legacy packages are in your tree |
| [solana-audit](https://github.com/LoserLab/solana-audit) | Catch CVEs and deprecated APIs that `npm audit` misses |
| [solana-codemod](https://github.com/LoserLab/solana-codemod) | Auto-migrate code from web3.js v1 to Kit v2 |
| **bigint-buffer-safe** (this tool) | Drop-in CVE fix for bigint-buffer |

**Recommended workflow:** `solana-deps` (find what's legacy) -> `solana-audit` (check for vulnerabilities) -> `solana-codemod` (fix the code) -> `solana-audit` (verify the result).

## Author

Created by [**Heathen**](https://x.com/heathenft)

Built in [Mirra](https://mirra.app)

## License

MIT License

Copyright (c) 2026 Heathen
