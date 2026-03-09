import { toBigIntBE, toBigIntLE, toBufferBE, toBufferLE } from "../src/index";

function bench(name: string, fn: () => void, iterations = 1_000_000) {
  // Warmup
  for (let i = 0; i < 1000; i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const elapsed = performance.now() - start;

  const opsPerSec = Math.round((iterations / elapsed) * 1000);
  console.log(`${name}: ${opsPerSec.toLocaleString()} ops/sec (${elapsed.toFixed(1)}ms)`);
}

// Test buffers matching Solana's common sizes
const buf8 = Buffer.from("40420F0000000000", "hex");   // u64 (lamports)
const buf16 = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex"); // u128 (token-2022)
const val64 = 1_000_000n;
const valMax128 = 340282366920938463463374607431768211455n;

console.log("bigint-buffer-safe benchmarks");
console.log("1,000,000 iterations each\n");

console.log("--- Buffer → BigInt ---");
bench("toBigIntBE  (u64,  8 bytes)", () => toBigIntBE(buf8));
bench("toBigIntLE  (u64,  8 bytes)", () => toBigIntLE(buf8));
bench("toBigIntBE  (u128, 16 bytes)", () => toBigIntBE(buf16));
bench("toBigIntLE  (u128, 16 bytes)", () => toBigIntLE(buf16));

console.log("\n--- BigInt → Buffer ---");
bench("toBufferBE  (u64,  8 bytes)", () => toBufferBE(val64, 8));
bench("toBufferLE  (u64,  8 bytes)", () => toBufferLE(val64, 8));
bench("toBufferBE  (u128, 16 bytes)", () => toBufferBE(valMax128, 16));
bench("toBufferLE  (u128, 16 bytes)", () => toBufferLE(valMax128, 16));
