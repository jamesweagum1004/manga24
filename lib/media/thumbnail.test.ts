import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { isPublicIPv4, resizeCover } from "./thumbnail";
import { optimizedImageUrl, responsiveImageSrcSet } from "./thumbnail-url";

test("thumbnail URLs preserve original URL and limit available sizes", () => {
  const src = "https://images.example/manga/en/cover.webp";
  const url = new URL(optimizedImageUrl(src, 200), "https://example.org");
  assert.equal(url.searchParams.get("src"), src);
  assert.equal(url.searchParams.get("w"), "320");
  assert.equal(optimizedImageUrl("/local.svg", 320), "/local.svg");
  assert.equal(responsiveImageSrcSet(src, [200, 320, NaN])?.split(", ").length, 1);
});

test("private and special network addresses cannot be fetched", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "172.31.1.1", "192.168.0.1", "100.64.0.1", "0.0.0.0", "224.1.1.1", "::1"]) {
    assert.equal(isPublicIPv4(ip), false, ip);
  }
  assert.equal(isPublicIPv4("8.8.8.8"), true);
});

test("creates genuinely smaller WebP without changing input bytes", async () => {
  const input = await sharp({ create: { width: 1200, height: 1600, channels: 3, background: "#648ca4" } }).png().toBuffer();
  const copy = Buffer.from(input);
  const output = await resizeCover(input, 320);
  const info = await sharp(output).metadata();
  assert.equal(info.format, "webp");
  assert.equal(info.width, 320);
  assert.equal(info.height, 427);
  assert.ok(output.length < input.length);
  assert.deepEqual(input, copy);
});

test("does not enlarge small source images", async () => {
  const input = await sharp({ create: { width: 80, height: 120, channels: 3, background: "#aaa" } }).png().toBuffer();
  assert.equal((await sharp(await resizeCover(input, 320)).metadata()).width, 80);
  await assert.rejects(resizeCover(Buffer.from("not an image"), 320));
});
