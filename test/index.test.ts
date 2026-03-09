import { describe, it, expect } from "vitest";
import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from "../src/index";

// ============================================================
// CVE-2025-3194: The original bigint-buffer crashes on these
// ============================================================

describe("CVE-2025-3194: input validation (DoS fix)", () => {
  it("toBigIntLE(null) throws TypeError instead of crashing", () => {
    expect(() => toBigIntLE(null as any)).toThrow(TypeError);
  });

  it("toBigIntBE(null) throws TypeError instead of crashing", () => {
    expect(() => toBigIntBE(null as any)).toThrow(TypeError);
  });

  it("toBigIntLE(undefined) throws TypeError", () => {
    expect(() => toBigIntLE(undefined as any)).toThrow(TypeError);
  });

  it("toBigIntBE(undefined) throws TypeError", () => {
    expect(() => toBigIntBE(undefined as any)).toThrow(TypeError);
  });

  it("toBigIntLE(number) throws TypeError", () => {
    expect(() => toBigIntLE(42 as any)).toThrow(TypeError);
  });

  it("toBigIntBE(string) throws TypeError", () => {
    expect(() => toBigIntBE("hello" as any)).toThrow(TypeError);
  });

  it("toBigIntLE({}) throws TypeError", () => {
    expect(() => toBigIntLE({} as any)).toThrow(TypeError);
  });

  it("toBigIntBE(Uint8Array) throws TypeError (must be Buffer)", () => {
    expect(() => toBigIntBE(new Uint8Array([1, 2, 3]) as any)).toThrow(TypeError);
  });

  it("toBufferBE(null, 8) throws TypeError", () => {
    expect(() => toBufferBE(null as any, 8)).toThrow(TypeError);
  });

  it("toBufferLE(null, 8) throws TypeError", () => {
    expect(() => toBufferLE(null as any, 8)).toThrow(TypeError);
  });

  it("toBufferBE(42n, -1) throws TypeError for negative width", () => {
    expect(() => toBufferBE(42n, -1)).toThrow(TypeError);
  });

  it("toBufferLE(42n, 1.5) throws TypeError for non-integer width", () => {
    expect(() => toBufferLE(42n, 1.5)).toThrow(TypeError);
  });

  it("toBufferBE(42, 8) throws TypeError for number instead of bigint", () => {
    expect(() => toBufferBE(42 as any, 8)).toThrow(TypeError);
  });
});

// ============================================================
// Functional parity with bigint-buffer@1.1.5
// ============================================================

describe("toBigIntBE", () => {
  it("converts single byte", () => {
    expect(toBigIntBE(Buffer.from([0xff]))).toBe(255n);
  });

  it("converts zero", () => {
    expect(toBigIntBE(Buffer.from([0x00]))).toBe(0n);
  });

  it("converts empty buffer to 0n", () => {
    expect(toBigIntBE(Buffer.alloc(0))).toBe(0n);
  });

  it("converts multi-byte big-endian", () => {
    // 0x0100 = 256
    expect(toBigIntBE(Buffer.from([0x01, 0x00]))).toBe(256n);
  });

  it("converts 8-byte (u64)", () => {
    // 1,000,000 = 0x00000000000F4240
    const buf = Buffer.from("00000000000F4240", "hex");
    expect(toBigIntBE(buf)).toBe(1_000_000n);
  });

  it("converts 16-byte (u128)", () => {
    const buf = Buffer.alloc(16);
    buf[15] = 1; // 1 in BE
    expect(toBigIntBE(buf)).toBe(1n);
  });

  it("converts max u64", () => {
    const buf = Buffer.from("FFFFFFFFFFFFFFFF", "hex");
    expect(toBigIntBE(buf)).toBe(18446744073709551615n);
  });

  it("converts max u128", () => {
    const buf = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex");
    expect(toBigIntBE(buf)).toBe(340282366920938463463374607431768211455n);
  });

  it("handles leading zeros", () => {
    const buf = Buffer.from([0x00, 0x00, 0x00, 0x01]);
    expect(toBigIntBE(buf)).toBe(1n);
  });
});

describe("toBigIntLE", () => {
  it("converts single byte", () => {
    expect(toBigIntLE(Buffer.from([0xff]))).toBe(255n);
  });

  it("converts zero", () => {
    expect(toBigIntLE(Buffer.from([0x00]))).toBe(0n);
  });

  it("converts empty buffer to 0n", () => {
    expect(toBigIntLE(Buffer.alloc(0))).toBe(0n);
  });

  it("converts multi-byte little-endian", () => {
    // 256 in LE = [0x00, 0x01]
    expect(toBigIntLE(Buffer.from([0x00, 0x01]))).toBe(256n);
  });

  it("converts 8-byte (u64) little-endian", () => {
    // 1,000,000 = 0x000F4240, LE = 40 42 0F 00 00 00 00 00
    const buf = Buffer.from("40420F0000000000", "hex");
    expect(toBigIntLE(buf)).toBe(1_000_000n);
  });

  it("converts max u64 LE", () => {
    const buf = Buffer.from("FFFFFFFFFFFFFFFF", "hex");
    expect(toBigIntLE(buf)).toBe(18446744073709551615n);
  });

  it("handles trailing zeros (which are leading in BE)", () => {
    const buf = Buffer.from([0x01, 0x00, 0x00, 0x00]);
    expect(toBigIntLE(buf)).toBe(1n);
  });
});

describe("toBufferBE", () => {
  it("converts 0n to zero-filled buffer", () => {
    const buf = toBufferBE(0n, 8);
    expect(buf).toEqual(Buffer.alloc(8));
  });

  it("converts small number", () => {
    const buf = toBufferBE(255n, 1);
    expect(buf).toEqual(Buffer.from([0xff]));
  });

  it("converts u64", () => {
    const buf = toBufferBE(1_000_000n, 8);
    expect(buf).toEqual(Buffer.from("00000000000F4240", "hex"));
  });

  it("converts max u64", () => {
    const buf = toBufferBE(18446744073709551615n, 8);
    expect(buf).toEqual(Buffer.from("FFFFFFFFFFFFFFFF", "hex"));
  });

  it("pads to width", () => {
    const buf = toBufferBE(1n, 4);
    expect(buf).toEqual(Buffer.from([0x00, 0x00, 0x00, 0x01]));
  });

  it("truncates if value exceeds width", () => {
    // 256 = 0x0100, but width=1 should give 0x00 (truncated)
    const buf = toBufferBE(256n, 1);
    expect(buf.length).toBe(1);
  });

  it("width 0 returns empty buffer", () => {
    expect(toBufferBE(42n, 0)).toEqual(Buffer.alloc(0));
  });
});

describe("toBufferLE", () => {
  it("converts 0n to zero-filled buffer", () => {
    const buf = toBufferLE(0n, 8);
    expect(buf).toEqual(Buffer.alloc(8));
  });

  it("converts small number", () => {
    const buf = toBufferLE(255n, 1);
    expect(buf).toEqual(Buffer.from([0xff]));
  });

  it("converts u64 to little-endian", () => {
    const buf = toBufferLE(1_000_000n, 8);
    expect(buf).toEqual(Buffer.from("40420F0000000000", "hex"));
  });

  it("converts max u64", () => {
    const buf = toBufferLE(18446744073709551615n, 8);
    expect(buf).toEqual(Buffer.from("FFFFFFFFFFFFFFFF", "hex"));
  });

  it("pads to width in LE", () => {
    const buf = toBufferLE(1n, 4);
    expect(buf).toEqual(Buffer.from([0x01, 0x00, 0x00, 0x00]));
  });

  it("width 0 returns empty buffer", () => {
    expect(toBufferLE(42n, 0)).toEqual(Buffer.alloc(0));
  });
});

// ============================================================
// Round-trip tests (the most important correctness check)
// ============================================================

describe("round-trip: toBigInt* <-> toBuffer*", () => {
  const values = [0n, 1n, 127n, 128n, 255n, 256n, 65535n, 1_000_000n, 2n ** 64n - 1n, 2n ** 128n - 1n];

  for (const val of values) {
    const width = val === 0n ? 1 : Math.ceil(val.toString(16).length / 2);
    const safeWidth = Math.max(width, 1);

    it(`BE round-trip: ${val}`, () => {
      const buf = toBufferBE(val, safeWidth);
      expect(toBigIntBE(buf)).toBe(val);
    });

    it(`LE round-trip: ${val}`, () => {
      const buf = toBufferLE(val, safeWidth);
      expect(toBigIntLE(buf)).toBe(val);
    });
  }

  it("round-trips Solana token amount (u64, 8 bytes)", () => {
    const amount = 1_000_000_000n; // 1 SOL in lamports
    expect(toBigIntLE(toBufferLE(amount, 8))).toBe(amount);
    expect(toBigIntBE(toBufferBE(amount, 8))).toBe(amount);
  });

  it("round-trips u128 (common in Solana token-2022)", () => {
    const val = 340282366920938463463374607431768211455n; // max u128
    expect(toBigIntLE(toBufferLE(val, 16))).toBe(val);
    expect(toBigIntBE(toBufferBE(val, 16))).toBe(val);
  });
});
