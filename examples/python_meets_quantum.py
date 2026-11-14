# Python lists use zero-based positions.
qubits = [0]
shots = 10
print("First qubit:", qubits[0])

import stim

circuit = stim.Circuit()
circuit.append("R", qubits)  # Prepare |0>
circuit.append("H", qubits)  # Prepare |+>
circuit.append("M", qubits)  # Measure in Z
print(circuit)

sampler = circuit.compile_sampler(seed=42)
samples = sampler.sample(shots=shots)
print("Shape:", samples.shape)
print("Outcomes:", samples.astype(int))
assert samples.shape == (shots, 1)

ones = int(samples[:, 0].sum())
zeros = shots - ones
print(f"0 outcomes: {zeros}; 1 outcomes: {ones}")
# A Python loop can inspect individual shots.
for shot_index, row in enumerate(samples[:3]):
    print("Shot", shot_index, "bit", int(row[0]))

# Two deterministic comparisons, each preparing a fresh |0>.
zero_circuit = stim.Circuit("R 0\nM 0")
one_circuit = stim.Circuit("R 0\nX 0\nM 0")
zero_samples = zero_circuit.compile_sampler().sample(shots=shots)
one_samples = one_circuit.compile_sampler().sample(shots=shots)
assert not zero_samples.any()
assert one_samples.all()
print("R then M: all 0; R then X then M: all 1")
