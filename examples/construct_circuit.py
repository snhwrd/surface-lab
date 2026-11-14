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

# Annotate three representative AZ0 relations on the same manual patch.
# This teaching subset is not a complete decoding detector set.
manual_annotated = stim.Circuit()
manual_annotated.append("R", data + ancillas)
manual_annotated += round_circuit
# AZ0 is position 1 in the eight-bit record; its initial sign is +1.
manual_annotated.append("DETECTOR", [stim.target_rec(-7)])
manual_annotated += round_circuit
# Compare AZ0 in round 2 with AZ0 in round 1.
manual_annotated.append("DETECTOR", [stim.target_rec(-7), stim.target_rec(-15)])
manual_annotated += round_circuit
manual_annotated.append("M", data)
# Compare final Z1 Z2 Z4 Z5 parity with the last AZ0 reading.
manual_annotated.append(
    "DETECTOR",
    [
        stim.target_rec(-16),
        stim.target_rec(-8),
        stim.target_rec(-7),
        stim.target_rec(-5),
        stim.target_rec(-4),
    ],
)
# Observable 0 is the final vertical logical-Z parity on D0, D3, D6.
manual_annotated.append(
    "OBSERVABLE_INCLUDE",
    [
        stim.target_rec(-9),
        stim.target_rec(-6),
        stim.target_rec(-3),
    ],
    0,
)
bridge_dets, bridge_flips = manual_annotated.compile_detector_sampler(seed=42).sample(
    shots=shots,
    separate_observables=True,
)
assert bridge_dets.shape == (shots, 3)
assert bridge_flips.shape == (shots, 1)
assert not bridge_dets.any()
assert not bridge_flips.any()
# Also verify that the declared parities are deterministic without noise.
manual_annotated.detector_error_model()
print("Manual annotation subset:", bridge_dets.shape, bridge_flips.shape)

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
