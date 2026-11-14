import argparse
import csv
import math

import numpy as np
import pymatching
import stim

parser = argparse.ArgumentParser(description="Compare surface-code memory experiments")
parser.add_argument("--shots", type=int, default=10000)
parser.add_argument("--rounds", type=int, default=3)
parser.add_argument("--seed", type=int, default=42)
parser.add_argument("--output", default="surface_code_results.csv")
args = parser.parse_args()
if args.shots < 1 or args.rounds < 1 or not 0 <= args.seed < 2**64 - 6:
    parser.error("shots/rounds must be positive; seed must be in [0, 2**64 - 6)")

distances = [3, 5]
noise_rates = [0.001, 0.005, 0.01]


def experiment(distance: int, rounds: int, shots: int, noise: float, seed: int) -> int:
    circuit = stim.Circuit.generated(
        "surface_code:rotated_memory_z",
        distance=distance,
        rounds=rounds,
        after_clifford_depolarization=noise,
    )
    model = circuit.detector_error_model(decompose_errors=True)
    matching = pymatching.Matching.from_detector_error_model(model)
    dets, actual = circuit.compile_detector_sampler(seed=seed).sample(
        shots=shots,
        separate_observables=True,
    )
    predicted = matching.decode_batch(dets)
    assert isinstance(predicted, np.ndarray)
    assert predicted.shape == actual.shape
    failed = np.any(predicted != actual, axis=1)
    return int(np.count_nonzero(failed))


# Test the pipeline with no inserted gate noise before comparing noisy cases.
for distance in distances:
    assert experiment(distance, args.rounds, min(args.shots, 1000), 0, args.seed) == 0
print("Noiseless sanity checks passed")


def wilson_interval(failures: int, shots: int) -> tuple[float, float]:
    if shots < 1 or not 0 <= failures <= shots:
        raise ValueError("Require shots > 0 and 0 <= failures <= shots")
    p = failures / shots
    z = 1.96  # Nominal two-sided 95% interval
    denom = 1 + z * z / shots
    center = (p + z * z / (2 * shots)) / denom
    half = z * math.sqrt(p * (1 - p) / shots + z * z / (4 * shots * shots)) / denom
    return (
        0.0 if failures == 0 else max(0.0, center - half),
        1.0 if failures == shots else min(1.0, center + half),
    )


results = []
case_index = 0
for noise in noise_rates:
    for distance in distances:
        case_seed = args.seed + case_index
        case_index += 1
        failures = experiment(distance, args.rounds, args.shots, noise, case_seed)
        rate = failures / args.shots
        low, high = wilson_interval(failures, args.shots)
        results.append(
            {
                "distance": distance,
                "rounds": args.rounds,
                "noise": noise,
                "shots": args.shots,
                "seed": case_seed,
                "failures": failures,
                "logical_rate": rate,
                "wilson95_low": low,
                "wilson95_high": high,
            }
        )
        print(
            f"d={distance}, rounds={args.rounds}, p={noise}, "
            f"failures={failures}/{args.shots}, rate={rate:.6g}, "
            f"Wilson95=[{low:.6g}, {high:.6g}]"
        )
        if failures == 0:
            print(
                f"  Zero events: approx. one-sided 95% bound {min(1, 3 / args.shots):.6g}"
            )

with open(args.output, "w", newline="", encoding="utf-8") as output:
    writer = csv.DictWriter(output, fieldnames=list(results[0]))
    writer.writeheader()
    writer.writerows(results)
print(f"Saved {len(results)} cases to {args.output}")
