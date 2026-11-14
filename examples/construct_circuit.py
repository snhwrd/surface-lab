import stim

data = list(range(9))
ancillas = [9, 10, 11, 12, 13, 14, 15, 16]
x_ancillas = [9, 12, 15, 16]
rounds = 3
shots = 8

# Initialize data once. Ancillas start in |0>.
circuit = stim.Circuit()
circuit.append("R", data + ancillas)

# Same four layers as Build the 2D lattice, in the site's orientation.
# Each pair is [control, target].
layers = [
    [9, 4, 5, 10, 7, 11, 12, 8, 1, 13, 16, 6],  # Layer 1
    [9, 1, 4, 10, 6, 11, 12, 5, 0, 13, 16, 3],  # Layer 2
    [9, 3, 2, 10, 4, 11, 12, 7, 8, 14, 15, 5],  # Layer 3
    [9, 0, 1, 10, 3, 11, 12, 4, 7, 14, 15, 2],  # Layer 4
]

round_circuit = stim.Circuit()
round_circuit.append("H", x_ancillas)
for targets in layers:
    round_circuit.append("TICK", [])
    round_circuit.append("CX", targets)

round_circuit.append("TICK", [])
round_circuit.append("H", x_ancillas)
round_circuit.append("TICK", [])
round_circuit.append("MR", ancillas)  # Measure Z, then reset ancillas

# Preserve data while repeating ancilla preparation/interactions/readout.
circuit += round_circuit * rounds
circuit.append("TICK", [])
circuit.append("M", data)  # Final data readout, only after all rounds

samples = circuit.compile_sampler(seed=42).sample(shots=shots)
check_bits = samples[:, : 8 * rounds].reshape(shots, rounds, 8)
changes = check_bits[:, 1:, :] ^ check_bits[:, :-1, :]
final_data = samples[:, 8 * rounds :]
# Vertical logical Z in the site's patch orientation.
logical_z = final_data[:, [0, 3, 6]].sum(axis=1) % 2
print("First round:", check_bits[0, 0].astype(int))
print("Any later check changes:", bool(changes.any()))
print("Final logical Z bits:", logical_z.astype(int))
assert not changes.any()
assert not logical_z.any()

# A separate generated memory experiment, using Stim's labeling convention.
annotated = stim.Circuit.generated(
    "surface_code:rotated_memory_z",
    distance=3,
    rounds=3,
)
print("Detectors:", annotated.num_detectors)
print("Logical observables:", annotated.num_observables)
print("DEM:", annotated.detector_error_model())

noisy = stim.Circuit.generated(
    "surface_code:rotated_memory_z",
    distance=3,
    rounds=3,
    after_clifford_depolarization=0.005,
)
dets, actual_flips = noisy.compile_detector_sampler(seed=42).sample(
    shots=1000,
    separate_observables=True,
)
print("Detector array:", dets.shape)
print("Actual logical flips:", actual_flips.shape)
# Next tutorial: compare PyMatching predictions with actual_flips.
