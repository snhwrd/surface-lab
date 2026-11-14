# Surface Lab project requirements

## GitHub Pages compatibility (required)

The complete website, including the circuit playground, must work as a static GitHub Pages project site at a repository subpath such as `/surface-lab/`.

- Publish only the contents of `dist/`. The standard build copies static assets from `web/` and must not require a running Python server, API, database or filesystem writes in production.
- Resolve scripts, worker files, WASM binaries and downloads relative to the deployed site. Do not hard-code `xps-server`, localhost, a Tailscale address or a domain-root asset path.
- Ship the Stim JavaScript loader, WASM binary, pinned build metadata and license with the static site. Running a circuit must not require a CDN, Pyodide, Python installation, cross-origin isolation headers or a backend.
- Perform simulation in a Web Worker. Provide execution limits and cancellation, and keep results tied to the circuit text that produced them.
- Verify the playground at both the root path and a GitHub Pages-style repository subpath. The normal CI workflow must test the shipped WASM engine.

The optional `Publish GitHub Pages` workflow is manual-only. Compatibility does not authorize making the site public. Keep the repository private. Publishing from a private personal repository requires an eligible GitHub plan and normally produces a public site; private site access requires an eligible Enterprise organization configuration. Review the intended site audience before running that deployment workflow.

## Circuit playground

Users can edit Stim program text, toggle to its native circuit diagram, run measurement sampling locally, and download the circuit and sampled records. Both representations share one program; changing views must not silently change it. Provide examples tied to the tutorials, visible error messages, responsive layouts and clear measurement-record ordering. Sampling raw measurements must not be presented as detector sampling or logical decoding.
