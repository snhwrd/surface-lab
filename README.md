# Surface Lab

An interactive six-lesson introduction to Python, stabilizers, the rotated 2D surface code, Stim circuits, and PyMatching decoding. Includes a keyboard-accessible parity playground, conceptual checkpoints, and browser-local progress.

## Develop

Install [uv](https://docs.astral.sh/uv/), then:

```sh
uv sync
uv run python scripts/build.py
uv run python -m http.server 8000 --directory dist
```

Open http://localhost:8000. The browser playground supports rotated-code distances 3, 5, 7, and 9 with static X errors and perfect check measurements. It reports the measured syndrome and the logical outcome of an exact minimum-weight X correction. Toggle the correction overlay or try single-error, beyond-limit-chain, logical-row, and stabilizer presets. Changing distance resets the pattern. The browser does not execute Python or use Stim/PyMatching for this model. Download lesson examples to run locally.

## Python experiment

```sh
uv run python examples/surface_code.py --distance 3 --shots 10000 --noise 0.005
uv run python examples/surface_code.py --distance 5 --shots 10000 --noise 0.005
```

Rounds equal distance. Noise is depolarization after Clifford gates, rather than a complete hardware noise model. The seeded sampler makes experiments reproducible with the locked environment; finite sampling does not establish a threshold. The experiment reports failures by comparing decoded predictions with actual observable flips.

## Checks

```sh
uv run ruff check .
uv run ruff format --check .
uv run ty check
node --check web/app.js
node --check web/lattice.js
node tests/lattice.cjs
```

CI checks and builds the site but does not deploy it. Publication is intentionally disabled pending owner review. GitHub Pages generally makes the site publicly accessible even for private source repositories; private Pages access requires an eligible enterprise configuration. Review visibility before enabling Pages.

## Sources

- [Stim](https://github.com/quantumlib/Stim)
- [PyMatching](https://pymatching.readthedocs.io/en/stable/)
- [uv, Ruff, and ty](https://docs.astral.sh/)

Progress stays in this browser's localStorage. No accounts or analytics are used. Fonts load from Google Fonts, with system fallback fonts.

## Environment limitation

Initial dependency resolution was blocked by unavailable DNS access to PyPI, so no uv.lock is committed yet. Run `uv lock` once network access is available and commit the resulting lockfile; then use `uv sync --locked` in CI and development. Ruff, ty, and the Stim experiment still require execution in that environment.

## Playground decoder

The decoder in `web/lattice.js` uses row-by-row dynamic programming to find a minimum-weight X pattern consistent with the Z-check syndrome. It receives only the syndrome. Assessment compares the proposed correction with the known inserted pattern: a residual X stabilizer preserves the logical state, while odd overlap with a vertical logical Z indicates a logical X failure. A zero syndrome can therefore mean either a harmless stabilizer or an undetected logical error. This ideal model guarantees correction of any pattern of at most `(d - 1) / 2` X errors; larger patterns are assessed individually, not rejected by count alone. It excludes phase errors, measurement faults and repeated rounds.

Decoder tests exhaust all 512 distance-3 patterns against brute-force minimum weights and independently check residual stabilizer membership, check commutation, single errors, logical rows, stabilizer patterns and seeded multi-error patterns at all supported distances.
