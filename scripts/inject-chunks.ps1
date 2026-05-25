$handlerPath = ".open-next/server-functions/default/handler.mjs"
$chunksDir = ".open-next/server-functions/default/.next/server/chunks/ssr"

if (-not (Test-Path $handlerPath)) {
    Write-Error "handler.mjs not found"
    exit 1
}

$handler = Get-Content $handlerPath -Raw
$chunks = Get-ChildItem -LiteralPath $chunksDir -Filter "*.js" | Sort-Object Name

Write-Output "Injecting $($chunks.Count) chunk files into handler.mjs..."

# Build inline require entries for all chunks
$inlineEntries = @()
foreach ($chunk in $chunks) {
    $relPath = ".open-next/server-functions/default/.next/server/chunks/ssr/$($chunk.Name)"
    $content = Get-Content $chunk.FullName -Raw
    $escaped = $content.Replace("\", "\\").Replace("`0", "").Replace("`n", "\n").Replace("`r", "\r").Replace("'", "\'")
    $inlineEntries += "'$relPath':(function(module,exports){eval('$escaped')})"
}

$inlineCode = "var __chunkModules = { $($inlineEntries -join ',').Replace('\n', '\n') };"
$inlineCode += "var __chunkRequire = function(path) { var m = __chunkModules[path]; if (m) { var mod = {exports:{}}; m(mod, mod.exports); return mod.exports; } throw new Error('Chunk not found: ' + path); };"

# Patch loadRuntimeChunkPath and loadChunkAsync to use __chunkRequire
$handler = $handler -replace 'function loadRuntimeChunkPath\(sourcePath, chunkPath\) \{[\s\S]*?(?=function loadChunkAsync)', 'function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) { return; }
    if (loadedChunks.has(chunkPath)) { return; }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = __chunkRequire(resolved);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, { cause });
        error.name = "ChunkLoadError";
        throw error;
    }
}
'

$handler = $handler -replace 'function loadChunkAsync\(chunkData\) \{[\s\S]*?(?=contextPrototype\.l = loadChunkAsync)', 'function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === "string" ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) { return unsupportedLoadChunk; }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            const chunkModules = __chunkRequire(resolved);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, { cause });
            error.name = "ChunkLoadError";
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    return entry;
}
'

# Insert __chunkModules definition after the existing __commonJS definitions
# Find the last __commonJS definition and insert after it
$insertPoint = $handler.LastIndexOf('});')
if ($insertPoint -ge 0) {
    $handler = $handler.Substring(0, $insertPoint + 3) + "`n`n" + $inlineCode + "`n" + $handler.Substring($insertPoint + 3)
}

Set-Content -Path $handlerPath -Value $handler -NoNewline
Write-Output "Done! Handler size: $((Get-Item $handlerPath).Length/1KB -as [int]) KiB"
