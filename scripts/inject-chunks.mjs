import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

const handlerPath = resolve(".open-next/server-functions/default/handler.mjs");
const chunksDir = resolve(".open-next/server-functions/default/.next/server/chunks/ssr");

let handler = readFileSync(handlerPath, "utf8");
const chunks = readdirSync(chunksDir).filter(f => f.endsWith(".js"));

let i = 100000;
const chunkVar = `__chunkModules_${Date.now()}`;
const entries = [];

for (const chunk of chunks) {
  const absPath = join(chunksDir, chunk);
  const key = absPath.replace(/\\/g, "/");
  const code = readFileSync(absPath, "utf8");
  const safeCode = code
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
  const varName = `${chunkVar}_${i++}`;
  entries.push(`"${key}":(${varName}=()=>{let m={exports:{}};eval(\`${safeCode}\`);return m.exports;})()`);
}

const injection = `
// INJECTED CHUNK MODULES
const __chunkRequire = (() => {
  const map = {${entries.join(",\n")}};
  return (p) => { const m = map[p]; if (!m) throw new Error("Chunk not found: " + p); return m; };
})();
`;

// Find a good insertion point - after the last __commonJS or __esm definition
const insertAfter = "var require_next_server=__commonJS";
const idx = handler.indexOf(insertAfter);
if (idx >= 0) {
  // Find the closing of this block
  const endIdx = handler.indexOf("});", idx);
  if (endIdx >= 0) {
    const insertPos = endIdx + 3;
    handler = handler.slice(0, insertPos) + "\n" + injection + handler.slice(insertPos);
  }
}

// Patch loadRuntimeChunkPath to use __chunkRequire
handler = handler.replace(
  /function loadRuntimeChunkPath\(sourcePath,\s*chunkPath\) \{[\s\S]*?^    \}/gm,
  `function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) { return; }
    if (loadedChunks.has(chunkPath)) { return; }
    try {
      const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
      const chunkModules = __chunkRequire(resolved);
      installCompressedModuleFactories(chunkModules, 0, moduleFactories);
      loadedChunks.add(chunkPath);
    } catch (cause) {
      const errorMessage = \`Failed to load chunk \${chunkPath}\`;
      const error = new Error(errorMessage, { cause });
      error.name = "ChunkLoadError";
      throw error;
    }
  }`
);

writeFileSync(handlerPath, handler, "utf8");
console.log(`Injected ${chunks.length} chunks`);
console.log(`Handler size: ${(readFileSync(handlerPath).length / 1024).toFixed(0)} KiB`);
