/**
 * bigint-buffer-safe
 *
 * Safe, pure-JS drop-in replacement for bigint-buffer.
 * Fixes CVE-2025-3194 (buffer overflow / DoS via unvalidated input).
 * No native N-API bindings. Works in Node.js and browsers.
 *
 * API-compatible with bigint-buffer@1.1.5
 */

function assertBuffer(value: unknown, fnName: string): asserts value is Buffer {
  if (!Buffer.isBuffer(value)) {
    throw new TypeError(
      `${fnName}: expected a Buffer, got ${value === null ? "null" : typeof value}`
    );
  }
}

function assertBigInt(value: unknown, fnName: string): asserts value is bigint {
  if (typeof value !== "bigint") {
    throw new TypeError(
      `${fnName}: expected a bigint, got ${value === null ? "null" : typeof value}`
    );
  }
}

function assertWidth(value: unknown, fnName: string): asserts value is number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new TypeError(
      `${fnName}: expected a non-negative integer width, got ${value}`
    );
  }
}

/**
 * Convert a big-endian Buffer to a BigInt.
 */
export function toBigIntBE(buf: Buffer): bigint {
  assertBuffer(buf, "toBigIntBE");
  if (buf.length === 0) return 0n;

  const hex = buf.toString("hex");
  if (hex.length === 0) return 0n;
  return BigInt("0x" + hex);
}

/**
 * Convert a little-endian Buffer to a BigInt.
 */
export function toBigIntLE(buf: Buffer): bigint {
  assertBuffer(buf, "toBigIntLE");
  if (buf.length === 0) return 0n;

  // Reverse to big-endian, then parse
  const reversed = Buffer.from(buf);
  reversed.reverse();
  const hex = reversed.toString("hex");
  if (hex.length === 0) return 0n;
  return BigInt("0x" + hex);
}

/**
 * Convert a BigInt to a big-endian Buffer of the specified width (bytes).
 */
export function toBufferBE(num: bigint, width: number): Buffer {
  assertBigInt(num, "toBufferBE");
  assertWidth(width, "toBufferBE");

  if (width === 0) return Buffer.alloc(0);

  const hex = num.toString(16).padStart(width * 2, "0");
  // Take only the last `width * 2` hex chars (truncate if num > width bytes)
  const truncated = hex.slice(-width * 2);
  return Buffer.from(truncated, "hex");
}

/**
 * Convert a BigInt to a little-endian Buffer of the specified width (bytes).
 */
export function toBufferLE(num: bigint, width: number): Buffer {
  assertBigInt(num, "toBufferLE");
  assertWidth(width, "toBufferLE");

  if (width === 0) return Buffer.alloc(0);

  const buf = toBufferBE(num, width);
  buf.reverse();
  return buf;
}
