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
node --check web/lattice-lesson.js
node --check web/surface-check.js
node --check web/circuit-guide.js
node --check web/decode-guide.js
node --check web/python-guide.js
node --check web/quizzes.js
node --check web/test-guide.js
node tests/lattice.cjs
node tests/lattice-schedule.cjs
node tests/quizzes.cjs
node tests/physical-layout.cjs
node tests/test-guide.cjs
```

GitHub Pages compatibility is a mandatory [project requirement](docs/requirements.md). The site must work entirely as static files, including under a repository subpath such as `/surface-lab/`. CI checks the bundled Stim WASM engine and the built Pages artifact. The manual-only **Publish GitHub Pages** workflow publishes `dist/` when explicitly run after configuring Pages to use GitHub Actions. It is not run by pushes. The repository remains private; review site visibility before publishing.

## Sources

- [Stim](https://github.com/quantumlib/Stim)
- [PyMatching](https://pymatching.readthedocs.io/en/stable/)
- [uv, Ruff, and ty](https://docs.astral.sh/)

Progress stays in this browser's localStorage. No accounts or analytics are used. Fonts load from Google Fonts, with system fallback fonts.

## Reproducible environment

The committed `uv.lock` pins the dependencies used by development and CI. Run `uv sync --locked` to install them.

## Playground decoder

The decoder in `web/lattice.js` uses row-by-row dynamic programming to find a minimum-weight X pattern consistent with the Z-check syndrome. The Z decoder rotates the patch to reuse that algorithm with the X-check syndrome. Both decoders receive only their syndrome, and treat X and Z components independently rather than using their correlations.

Assessment compares each proposed correction with its known inserted component: a residual stabilizer preserves the logical state, while odd overlap with the conjugate logical operator indicates a logical failure. A zero syndrome can therefore mean either a harmless stabilizer or an undetected logical error. Overall correction succeeds only when both sectors succeed. With perfect checks, the model guarantees correction on at most `(d - 1) / 2` affected qubits, including mixed X/Z/Y errors. Larger patterns are assessed individually, not rejected by count alone. Measurement faults and repeated rounds are excluded.

Decoder tests exhaust all 512 distance-3 patterns separately for X and Z against brute-force minimum weights. They independently check residual stabilizer membership, check commutation, single errors, logical strings, stabilizer patterns and seeded multi-error patterns at all supported distances, plus mixed Pauli patterns within the correction radius.

## Stabilizer notation guide

Open “Stabilizer notation” in the navigation, or link directly with `/#notation`. The guide introduces state kets, Pauli strings and phases, stabilizer generators and code spaces, syndrome bits, logical operators, code distance, and optional binary symplectic notation. Its two-qubit explorer compares a selected error with an XX or ZZ check using local Pauli commutation. Links from the stabilizer, lattice and decoding lessons connect the guide to the course; further reading cites IBM Quantum, Preskill, and Gottesman.

## Physical-qubit view

In “Lattice playground,” toggle “Show data and ancilla roles” to inspect the selected patch. The distance selector, inserted X/Z pattern and decoder results are shared between both views. Toggle off to resume inserting errors. The legacy `/#surface-code` link opens the playground with the toggle enabled. Data qubits are labeled D0, D1, …; dedicated X- and Z-check ancillas are labeled AX0, … and AZ0, …. Selecting an ancilla highlights its support and CNOT control-to-target arrows, with preparation and measurement instructions. Selecting data lists its neighboring checks and its role in each. The physical-qubit count is `2*d*d - 1`, assuming one dedicated ancilla per generator. The diagram explains connectivity and does not prescribe a fault-tolerant gate schedule.

## Guided lattice construction

Tutorial 3 builds the distance-3 patch in seven illustrated steps, with a selectable four-layer CNOT schedule. For this site’s orientation (screen y increases downward), X ancillas visit SE, NE, SW, NW; Z ancillas visit SE, SW, NE, NW. Missing boundary corners are skipped. Generator commutation, gate ordering, and syndrome-record ordering are treated separately. Schedule tests check physical-qubit conflicts and conjugate every ancilla measurement backwards through the complete circuit to verify its measured generator, including signs. They also check bulk hook-pair orientation. The lesson discusses initialization-dependent first results and repeated-round comparisons.

The “Think in stabilizers” lesson also connects its two-data-qubit example to the actual AZ0 (Z1 Z2 Z4 Z5) and AX0 (X0 X1 X3 X4) bulk generators. Each has a highlighted patch, four-data-plus-ancilla circuit diagrams with and without an anticommuting error, and a standalone Stim download. The example prepares product states and measures an isolated check rather than encoding the full patch.

## Guided circuit construction

Tutorial 4 continues the exact patch mapping and four-layer schedule from Tutorial 3 in eight steps. It builds a noiseless round manually, preserves the data over repeated ancilla readouts, and checks raw measurement changes and final logical-Z parity. Review buttons open the corresponding earlier construction step. It then introduces a separate Stim-generated memory circuit with detector and observable annotations, explains the convention difference, and adds Clifford depolarization before handing off to decoding. Run `uv run python examples/construct_circuit.py` for the complete executable example; the same content is downloadable in the tutorial.

## Guided detection and decoding

Tutorial 5 traces the annotated generated memory circuit through a noiseless baseline, noisy detector sampling, detector-error-model construction, matching, logical-flip prediction, and failure-rate reporting. An illustrative shot selector separates detector events from decoding failures, and review buttons open the relevant circuit-guide step. Run `uv run python examples/detect_decode.py` for the complete 10,000-shot example. Ground-truth observable flips are used only for evaluation, not as decoder inputs. The reported logical-Z memory error rate is per complete experiment, not a full logical-channel benchmark or a per-round error rate.

## First Python tutorial and quizzes

“Python meets quantum” is a seven-step introduction to workspace setup, variables and lists, Stim circuit preparation, H and Z-basis measurement, shot arrays, counting, and deterministic comparison circuits. Run `uv run python examples/python_meets_quantum.py` for the complete example.

All six tutorials end with five-question quizzes (30 questions total), per-question explanations and retryable checking. A newly completed tutorial requires five correct answers checked together. Choices and checked results are saved in the existing browser-local progress record. Older completion marks are preserved; returning readers can review the new quizzes without losing completed tutorials. Changing an answer requires checking again. Reset progress clears both completion marks and quiz answers.

In the playground’s physical-qubit overlay, “Align links N/S/E/W” rotates the diagram 45 degrees so all data–ancilla connections are horizontal or vertical. “Return to original grid” reverses it. Text stays upright; the selected check, distance and inserted errors are preserved. A compass marks screen directions in the cardinal view. This is a display rotation, not a change to the logical code or gate schedule.

## Guided surface-code testing

Tutorial 6 is an eight-step comparison guide linked to the decoding tutorial, with a browser calculator for binomial counts and nominal two-sided 95% Wilson intervals. The complete example is `examples/test_surface_code.py`: compare distances 3 and 5 at three Clifford-depolarization settings with an explicitly fixed round count, run noiseless sanity checks first, and save rates, seeds and interval endpoints to CSV. Run `uv run python examples/test_surface_code.py --shots 10000 --rounds 3 --output results.csv`. Output files are written anew. The guide distinguishes fixed-duration comparisons from rounds = distance, one-sided zero-event bounds from two-sided intervals, and exploratory scaling from threshold claims. The five-question quiz remains at the end.

## Circuit playground

Open “Circuit playground” or `#circuit-playground`. Edit Stim instructions, toggle between text and Stim’s native circuit diagram, and sample measurement records locally in a Web Worker. Examples include Bell pairs, four-data-qubit surface-code checks, noise, and the tutorial’s three-round distance-3 circuit. Download circuits as `.stim` and shot records as CSV.

The bundled engine is real Stim 1.16.0 compiled to WebAssembly with a JavaScript interface; Pyodide and a Python backend are unnecessary. Assets resolve relative to the site, so the playground also works on GitHub Pages. Limits and a Stop button bound execution. Results are raw measurements, not decoded detector events. See [WASM build instructions](wasm/README.md) for the pinned source, toolchain, and resource limits.

After building, run `node tests/stim-wasm.cjs` and `node tests/pages-compat.cjs`.

All tutorial Stim circuits have “Open in circuit playground” links beside the relevant steps and complete examples. Links load standalone Stim instructions, including both inserted-error cases, cumulative manual construction stages and the distance/noise sweep circuits. Circuit links can be bookmarked or shared and work under a GitHub Pages project subpath. The playground samples raw measurements; Python/PyMatching analysis stays in the downloaded scripts. Run `node tests/tutorial-circuits.cjs` to verify the linked circuits.

Resources is available from the shared footer on every view. Circuit diagrams uses the same catalog as the tutorial playground links, showing every circuit with its native Stim diagram, source instructions, `.stim` download, and playground link.
