"""Run a rotated surface-code memory experiment with Stim and PyMatching."""

import argparse

import numpy as np
import pymatching
import stim


def experiment(distance: int, shots: int, noise: float) -> tuple[int, float]:
    """Return decoder failures and their frequency for a seeded memory experiment."""
    if distance < 3 or distance % 2 == 0:
        raise ValueError("distance must be odd and at least 3")
    if shots < 1 or not 0 <= noise <= 1:
        raise ValueError("shots must be positive and noise must be in [0, 1]")
    circuit = stim.Circuit.generated(
        "surface_code:rotated_memory_z",
        distance=distance,
        rounds=distance,
        after_clifford_depolarization=noise,
    )
    model = circuit.detector_error_model(decompose_errors=True)
    matching = pymatching.Matching.from_detector_error_model(model)
    sampler = circuit.compile_detector_sampler(seed=42)
    detectors, actual = sampler.sample(shots, separate_observables=True)
    predicted = matching.decode_batch(detectors)
    failures = int(np.count_nonzero(np.any(predicted != actual, axis=1)))
    return failures, failures / shots


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--distance", type=int, default=3)
    parser.add_argument("--shots", type=int, default=10000)
    parser.add_argument("--noise", type=float, default=0.005)
    args = parser.parse_args()
    failures, rate = experiment(args.distance, args.shots, args.noise)
    print(f"d={args.distance}, p={args.noise}, shots={args.shots}")
    print(f"Logical failures: {failures}; estimated logical rate: {rate:.6g}")
    if failures == 0:
        print(f"Zero events: approximate 95% upper bound is {3 / args.shots:.6g}")


if __name__ == "__main__":
    main()
