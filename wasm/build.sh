#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
stim_build_cache="${XDG_CACHE_HOME:-$HOME/.cache}/surface-lab-wasm-build"
stim_source="$stim_build_cache/Stim"
stim_commit=e2fc1eca7fd21684d433aa5f10f4504ea4860d07
command -v emcmake >/dev/null || { echo 'Activate Emscripten 4.0.20 first (source emsdk_env.sh).' >&2; exit 1; }
emcc --version | head -n 1 | grep -q '4\.0\.20' || { echo 'This build pins Emscripten 4.0.20.' >&2; exit 1; }
mkdir -p "$stim_build_cache"
if [[ ! -d "$stim_source/.git" ]]; then
  git clone --depth 1 --branch v1.16.0 https://github.com/quantumlib/Stim.git "$stim_source"
fi
[[ "$(git -C "$stim_source" rev-parse HEAD)" == "$stim_commit" ]] || { echo 'Unexpected Stim source commit.' >&2; exit 1; }
emcmake cmake -S "$project_root/wasm" -B "$stim_build_cache/build" -DSTIM_SOURCE="$stim_source" -DCMAKE_BUILD_TYPE=Release
cmake --build "$stim_build_cache/build" --parallel 2
cp "$stim_build_cache/build/stim_engine.js" "$project_root/web/vendor/stim/stim_engine.js"
cp "$stim_build_cache/build/stim_engine.wasm" "$project_root/web/vendor/stim/stim_engine.wasm"
cp "$stim_source/LICENSE" "$project_root/web/vendor/stim/LICENSE-Stim.txt"
echo 'Updated the self-hosted Stim browser engine. Run the WASM tests and normal site build.'
