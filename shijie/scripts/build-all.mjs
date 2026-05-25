#!/usr/bin/env node

// Build both standard and lite NSIS installers.
// Standard: WebView2 embedBootstrapper included (~1.8MB)
// Lite:     WebView2 skipped (for users who already have WebView2)

import { execSync } from "child_process";
import { copyFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const bundleDir = join(root, "src-tauri", "target", "release", "bundle", "nsis");
const outDir = join(root, "dist-installer");

mkdirSync(outDir, { recursive: true });

function build(label, args) {
  console.log(`\n=== Building ${label} ===\n`);
  execSync(`npx tauri build ${args}`, {
    stdio: "inherit",
    cwd: root,
    shell: true,
  });
  // Find the built .exe
  const candidates = [
    "拾阶_0.1.0_x64-setup.exe",
    "MyWorld_0.1.0_x64-setup.exe",
    "myworld_0.1.0_x64-setup.exe",
    "拾阶_0.1.0_x64_en-US.msi",
  ];
  let found = null;
  for (const name of candidates) {
    const full = join(bundleDir, name);
    if (existsSync(full)) {
      found = full;
      break;
    }
  }
  if (!found) {
    // Try glob
    const files = execSync(`dir /b "${bundleDir}\\*.exe" "${bundleDir}\\*.msi" 2>nul`, {
      cwd: bundleDir,
      shell: true,
      encoding: "utf-8",
    }).trim();
    if (files) {
      found = join(bundleDir, files.split("\n")[0].trim());
    }
  }
  if (found) {
    const ext = found.split(".").pop();
    const dest = join(outDir, `MyWorld_0.1.0_${label}.${ext}`);
    copyFileSync(found, dest);
    console.log(`\n→ ${dest}`);
  } else {
    console.error(`\nCould not find built installer in ${bundleDir}`);
  }
}

const target = process.argv[2];

if (target === "lite") {
  build("lite", "--config src-tauri/tauri.conf.json --config src-tauri/tauri.conf.lite.json");
} else if (target === "standard") {
  build("standard", "");
} else {
  // Build both
  build("lite", "--config src-tauri/tauri.conf.json --config src-tauri/tauri.conf.lite.json");
  build("standard", "");
  console.log("\n=== Done ===");
  console.log(`Installers: ${outDir}`);
}
