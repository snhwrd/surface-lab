# Surface Lab

An interactive six-lesson introduction to Python, stabilizers, the rotated 2D surface code, Stim circuits, and PyMatching decoding. Includes a keyboard-accessible parity playground, conceptual checkpoints, and browser-local progress.

## Develop

Install [uv](https://docs.astral.sh/uv/), then:

```sh
uv sync
uv run python scripts/build.py
uv run python -m http.server 8000 --directory dist
```

Open http://localhost:8000. The browser playground models perfect, static stabilizer parity. It does not execute Python. Download lesson examples to run locally.

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
```

CI checks and builds the site but does not deploy it. Publication is intentionally disabled pending owner review. GitHub Pages generally makes the site publicly accessible even for private source repositories; private Pages access requires an eligible enterprise configuration. Review visibility before enabling Pages.

## Sources

- [Stim](https://github.com/quantumlib/Stim)
- [PyMatching](https://pymatching.readthedocs.io/en/stable/)
- [uv, Ruff, and ty](https://docs.astral.sh/)

Progress stays in this browser's localStorage. No accounts or analytics are used. Fonts load from Google Fonts, with system fallback fonts.

## Environment limitation

Initial dependency resolution was blocked by unavailable DNS access to PyPI, so no uv.lock is committed yet. Run `uv lock` once network access is available and commit the resulting lockfile; then use `uv sync --locked` in CI and development. Ruff, ty, and the Stim experiment still require execution in that environment.
