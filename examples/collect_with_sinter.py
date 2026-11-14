import argparse
from importlib.metadata import version

import sinter
import stim


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Collect resumable surface-code statistics"
    )
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--max-shots", type=int, default=10000)
    parser.add_argument("--max-errors", type=int, default=100)
    parser.add_argument("--rounds", type=int, default=3)
    parser.add_argument("--output", default="sinter_results.csv")
    parser.add_argument("--plot", default=None, help="Optional output PNG filename")
    args = parser.parse_args()
    if min(args.workers, args.max_shots, args.max_errors, args.rounds) < 1:
        parser.error("workers, budgets and rounds must be positive integers")
    return args


def check_noiseless(rounds: int) -> None:
    for distance in [3, 5]:
        clean = stim.Circuit.generated(
            "surface_code:rotated_memory_z",
            distance=distance,
            rounds=rounds,
        )
        dets, flips = clean.compile_detector_sampler().sample(
            shots=100,
            separate_observables=True,
        )
        assert not dets.any()
        assert not flips.any()
        clean.detector_error_model()
    print("Noiseless detector/observable checks passed")


def make_tasks(rounds: int) -> list[sinter.Task]:
    tasks = []
    versions = {name: version(name) for name in ["stim", "sinter", "pymatching"]}
    for noise in [0.001, 0.005, 0.01]:
        for distance in [3, 5]:
            circuit = stim.Circuit.generated(
                "surface_code:rotated_memory_z",
                distance=distance,
                rounds=rounds,
                after_clifford_depolarization=noise,
            )
            tasks.append(
                sinter.Task(
                    circuit=circuit,
                    detector_error_model=circuit.detector_error_model(
                        decompose_errors=True
                    ),
                    decoder="pymatching",
                    json_metadata={
                        "distance": distance,
                        "rounds": rounds,
                        "noise": noise,
                        "task": "rotated_memory_z",
                        "noise_model": "after_clifford_depolarization",
                        "versions": versions,
                    },
                )
            )
    return tasks


def collect_results(args: argparse.Namespace) -> list[sinter.TaskStats]:
    tasks = make_tasks(args.rounds)
    stats = sinter.collect(
        num_workers=args.workers,
        tasks=tasks,
        max_shots=args.max_shots,
        max_errors=args.max_errors,
        save_resume_filepath=args.output,
        print_progress=True,
    )
    # A resume file can also contain old experiments. Report only this task set.
    active_ids = {task.strong_id() for task in tasks}
    return [stat for stat in stats if stat.strong_id in active_ids]


def report_results(stats: list[sinter.TaskStats]) -> None:
    for stat in sorted(
        stats, key=lambda s: (s.json_metadata["noise"], s.json_metadata["distance"])
    ):
        kept = stat.shots - stat.discards
        rate = stat.errors / kept if kept else float("nan")
        print(
            f"d={stat.json_metadata['distance']}, p={stat.json_metadata['noise']}, "
            f"rounds={stat.json_metadata['rounds']}, decoder={stat.decoder}, "
            f"shots={stat.shots}, discards={stat.discards}, errors={stat.errors}, "
            f"rate_per_experiment={rate:.6g}"
        )


def save_plot(stats: list[sinter.TaskStats], output: str) -> None:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots()
    sinter.plot_error_rate(
        ax=ax,
        stats=stats,
        x_func=lambda stat: stat.json_metadata["noise"],
        group_func=lambda stat: f"d={stat.json_metadata['distance']}",
        highlight_max_likelihood_factor=1000,
    )
    ax.set_xscale("log")
    ax.set_yscale("log")
    ax.set_xlabel("Clifford depolarization parameter")
    ax.set_ylabel("Logical-Z decoding failure probability per experiment")
    ax.legend()
    fig.tight_layout()
    fig.savefig(output)
    plt.close(fig)
    print("Saved plot:", output)


if __name__ == "__main__":
    args = parse_args()
    check_noiseless(args.rounds)
    stats = collect_results(args)
    report_results(stats)
    if args.plot:
        save_plot(stats, args.plot)
