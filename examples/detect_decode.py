import numpy as np
import pymatching
import stim

distance = 3
rounds = 3
shots = 10000
noise = 0.005

# Verify the annotated circuit before adding noise.
clean = stim.Circuit.generated(
    "surface_code:rotated_memory_z",
    distance=distance,
    rounds=rounds,
)
clean_dets, clean_actual = clean.compile_detector_sampler(seed=42).sample(
    shots=100,
    separate_observables=True,
)
assert not clean_dets.any()
assert not clean_actual.any()

circuit = stim.Circuit.generated(
    "surface_code:rotated_memory_z",
    distance=distance,
    rounds=rounds,
    after_clifford_depolarization=noise,
)

sampler = circuit.compile_detector_sampler(seed=42)
dets, actual = sampler.sample(shots=shots, separate_observables=True)
print("Detection events:", dets.shape)
print("Actual logical flips:", actual.shape)
assert dets.shape == (shots, circuit.num_detectors)
assert actual.shape == (shots, circuit.num_observables)

model = circuit.detector_error_model(decompose_errors=True)
matching = pymatching.Matching.from_detector_error_model(model)
print("Detector count:", circuit.num_detectors)
print("Tracked logical observables:", circuit.num_observables)

# Give the decoder only detection events, never the known answers.
predicted = matching.decode_batch(dets)
assert isinstance(predicted, np.ndarray)
assert predicted.shape == actual.shape

mismatch = predicted != actual
failed = np.any(mismatch, axis=1)
failures = int(np.count_nonzero(failed))

for i in range(5):
    print(
        "Shot",
        i,
        "fired detectors",
        np.flatnonzero(dets[i]).tolist(),
        "predicted",
        predicted[i].astype(int).tolist(),
        "actual",
        actual[i].astype(int).tolist(),
        "failed",
        bool(failed[i]),
    )

rate = failures / shots
print(f"d={distance}, rounds={rounds}, noise={noise}, shots={shots}")
print(f"Logical decoding failures: {failures}; rate: {rate:.6g}")
if failures == 0:
    print(f"Approximate 95% upper bound with zero events: {3 / shots:.6g}")
assert 0 <= failures <= shots
