# Surface Lab

An interactive six-lesson introduction to Python, stabilizers, the rotated 2D surface code, Stim circuits, and PyMatching decoding. Includes a keyboard-accessible parity playground, conceptual checkpoints, and browser-local progress.

## Develop

Install [uv](https://docs.astral.sh/uv/), then:

```sh
uv sync
uv run python scripts/build.py
uv run python -m http.server 8000 --directory dist
```

Open http://localhost:8000. The browser playground supports rotated-code distances 3, 5, 7, and 9 with static X/Z errors and perfect check measurements. It reports the measured syndrome and the logical outcome of independent minimum-weight X and Z corrections. Toggle the correction overlay or try single-error, beyond-limit-chain, logical-row, and stabilizer presets. Switching the X/Z insertion tool preserves the pattern; placing both components on one qubit gives Y up to global phase. Changing distance resets both components. The browser does not execute Python or use Stim/PyMatching for this model. Download lesson examples to run locally.

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
node --check web/notation.js
node --check web/surface-view.js
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

The decoder in `web/lattice.js` uses row-by-row dynamic programming to find a minimum-weight X pattern consistent with the Z-check syndrome. The Z decoder rotates the patch to reuse that algorithm with the X-check syndrome. Both decoders receive only their syndrome, and treat X and Z components independently rather than using their correlations.

Assessment compares each proposed correction with its known inserted component: a residual stabilizer preserves the logical state, while odd overlap with the conjugate logical operator indicates a logical failure. A zero syndrome can therefore mean either a harmless stabilizer or an undetected logical error. Overall correction succeeds only when both sectors succeed. With perfect checks, the model guarantees correction on at most `(d - 1) / 2` affected qubits, including mixed X/Z/Y errors. Larger patterns are assessed individually, not rejected by count alone. Measurement faults and repeated rounds are excluded.

Decoder tests exhaust all 512 distance-3 patterns separately for X and Z against brute-force minimum weights. They independently check residual stabilizer membership, check commutation, single errors, logical strings, stabilizer patterns and seeded multi-error patterns at all supported distances, plus mixed Pauli patterns within the correction radius.

## Stabilizer notation guide

Open “Stabilizer notation” in the navigation, or link directly with `/#notation`. The guide introduces state kets, Pauli strings and phases, stabilizer generators and code spaces, syndrome bits, logical operators, code distance, and optional binary symplectic notation. Its two-qubit explorer compares a selected error with an XX or ZZ check using local Pauli commutation. Links from the stabilizer, lattice and decoding lessons connect the guide to the course; further reading cites IBM Quantum, Preskill, and Gottesman.

## Physical-qubit view

In “Lattice playground,” toggle “Show data and ancilla roles” to inspect the selected patch. The distance selector, inserted X/Z pattern and decoder results are shared between both views. Toggle off to resume inserting errors. The legacy `/#surface-code` link opens the playground with the toggle enabled. Data qubits are labeled D0, D1, …; dedicated X- and Z-check ancillas are labeled AX0, … and AZ0, …. Selecting an ancilla highlights its support and CNOT control-to-target arrows, with preparation and measurement instructions. Selecting data lists its neighboring checks and its role in each. The physical-qubit count is `2*d*d - 1`, assuming one dedicated ancilla per generator. The diagram explains connectivity and does not prescribe a fault-tolerant gate schedule.
