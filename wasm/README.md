# Stim browser engine

`web/vendor/stim/` contains the shipped JavaScript loader and WASM binary. They use Stim v1.16.0 at commit `e2fc1eca7fd21684d433aa5f10f4504ea4860d07` with the small project-owned Embind bridge in `stim_bridge.cc`.

The bridge uses Stim's actual parser, timeline SVG renderer and tableau sampler. The original library also has JavaScript bindings; this bridge adds complete measurement-record sampling and diagrams to the interface needed by the site. No surrogate simulator or JavaScript circuit parser is substituted for Stim.

To reproduce the build, install and activate Emscripten 4.0.20, then run `bash wasm/build.sh` from a checkout with CMake, Git, Make, Python and Node available. The script verifies the Stim commit. Build outputs are committed so standard site builds and GitHub Pages deployment do not need Emscripten.

Runtime limits: 100 KB program text, qubit index span 64, 512 recorded measurement bits per shot, 4000 expanded instructions, 32000 expanded targets and 2000 shots. A worker timeout and Stop button terminate stalled runs. Seeds are unsigned 32-bit values. Samples are raw Stim measurement records, in chronological record order. Detector and observable annotations may appear in the diagram but are not returned as detection-event or decoding results.

Native SVG is displayed as an image rather than inserting user-derived SVG markup into the page DOM. The playground accepts Stim text only, not arbitrary JavaScript. It uses one self-hosted worker and single-threaded WASM, so GitHub Pages needs no COOP/COEP headers or backend.

See `docs/requirements.md` for the mandatory GitHub Pages compatibility requirement and `web/vendor/stim/LICENSE-Stim.txt` for the upstream license.
