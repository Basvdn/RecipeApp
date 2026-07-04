// Vendors the Tesseract.js OCR assets (worker script, wasm core, language data)
// into public/tesseract/ so OCR runs fully offline with no CDN dependency.
// Run once after `npm install` (also runs automatically via `npm run setup`).
import { mkdir, copyFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const publicDir = path.join(root, "public", "tesseract");
const coreDir = path.join(publicDir, "core");
const langDataDir = path.join(publicDir, "lang-data");

await mkdir(coreDir, { recursive: true });
await mkdir(langDataDir, { recursive: true });

const workerSrc = path.join(root, "node_modules", "tesseract.js", "dist", "worker.min.js");
await copyFile(workerSrc, path.join(publicDir, "worker.min.js"));
console.log("Copied worker.min.js");

const coreSrcDir = path.join(root, "node_modules", "tesseract.js-core");
const coreFiles = [
  "tesseract-core-lstm.js",
  "tesseract-core-lstm.wasm",
  "tesseract-core-lstm.wasm.js",
  "tesseract-core-simd-lstm.js",
  "tesseract-core-simd-lstm.wasm",
  "tesseract-core-simd-lstm.wasm.js",
  "tesseract-core-relaxedsimd-lstm.js",
  "tesseract-core-relaxedsimd-lstm.wasm",
  "tesseract-core-relaxedsimd-lstm.wasm.js",
];
for (const file of coreFiles) {
  await copyFile(path.join(coreSrcDir, file), path.join(coreDir, file));
}
console.log(`Copied ${coreFiles.length} wasm core files`);

const langs = ["eng", "nld"];
const tmpDir = await mkdtemp(path.join(os.tmpdir(), "tessdata-"));
try {
  for (const lang of langs) {
    const dest = path.join(langDataDir, `${lang}.traineddata.gz`);
    if (existsSync(dest)) {
      console.log(`${lang}.traineddata.gz already present, skipping download`);
      continue;
    }
    console.log(`Fetching @tesseract.js-data/${lang} from npm`);
    execFileSync("npm", ["pack", `@tesseract.js-data/${lang}@1.0.0`], { cwd: tmpDir, stdio: "inherit" });
    const tarball = path.join(tmpDir, `tesseract.js-data-${lang}-1.0.0.tgz`);
    execFileSync("tar", ["-xzf", tarball, "-C", tmpDir, `package/4.0.0_best_int/${lang}.traineddata.gz`]);
    await copyFile(path.join(tmpDir, "package", "4.0.0_best_int", `${lang}.traineddata.gz`), dest);
  }
} finally {
  await rm(tmpDir, { recursive: true, force: true });
}
console.log("OCR assets ready in public/tesseract/");
