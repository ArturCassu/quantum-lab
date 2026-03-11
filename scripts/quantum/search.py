"""Quantum Search — Grover's Algorithm.

Implementação do algoritmo de Grover usando Qiskit 1.x.
Busca quadraticamente mais rápida que busca linear: O(√N) vs O(N).

O algoritmo usa um oráculo que marca o item alvo e um operador de
difusão que amplifica a amplitude do estado marcado.
"""
import time
import sys
import math

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator


def create_oracle(n_qubits: int, target: int) -> QuantumCircuit:
    """
    Cria o oráculo que marca o estado |target⟩ com fase -1.

    O oráculo aplica uma inversão de fase no estado alvo:
    |target⟩ → -|target⟩ (todos os outros estados ficam inalterados).

    Args:
        n_qubits: número de qubits
        target: índice do item a encontrar (0 a 2^n - 1)
    """
    oracle = QuantumCircuit(n_qubits, name="Oracle")

    # Converte target para binário e aplica X nos qubits que são 0
    target_bits = format(target, f"0{n_qubits}b")[::-1]

    # Flip qubits que são 0 no target
    for i, bit in enumerate(target_bits):
        if bit == "0":
            oracle.x(i)

    # Multi-controlled Z gate (marca o estado com fase -1)
    if n_qubits == 1:
        oracle.z(0)
    else:
        # MCZ = H no último qubit + MCX + H no último qubit
        oracle.h(n_qubits - 1)
        oracle.mcx(list(range(n_qubits - 1)), n_qubits - 1)
        oracle.h(n_qubits - 1)

    # Desfaz os flips
    for i, bit in enumerate(target_bits):
        if bit == "0":
            oracle.x(i)

    return oracle


def create_diffuser(n_qubits: int) -> QuantumCircuit:
    """
    Cria o operador de difusão de Grover (inversão sobre a média).

    Aplica: 2|s⟩⟨s| - I, onde |s⟩ é a superposição uniforme.
    Isso amplifica a amplitude do estado marcado pelo oráculo.
    """
    diffuser = QuantumCircuit(n_qubits, name="Diffuser")

    # H em todos os qubits
    diffuser.h(range(n_qubits))

    # X em todos os qubits
    diffuser.x(range(n_qubits))

    # Multi-controlled Z
    diffuser.h(n_qubits - 1)
    diffuser.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    diffuser.h(n_qubits - 1)

    # X em todos os qubits
    diffuser.x(range(n_qubits))

    # H em todos os qubits
    diffuser.h(range(n_qubits))

    return diffuser


def grovers_search(n_qubits: int, target: int, shots: int = 1024) -> dict:
    """
    Executa o algoritmo de Grover completo.

    Args:
        n_qubits: número de qubits (espaço de busca = 2^n_qubits)
        target: item a encontrar
        shots: número de execuções do circuito

    Returns:
        dict com resultados (contagens de medição)
    """
    N = 2 ** n_qubits
    num_iterations = max(1, int(math.pi / 4 * math.sqrt(N)))

    print(f"  Espaço de busca: {N} itens")
    print(f"  Iterações de Grover: {num_iterations}")
    print(f"  Speedup vs clássico: ~{N}/{num_iterations} = {N/num_iterations:.1f}x")
    print()

    # Constrói o circuito
    qc = QuantumCircuit(n_qubits, n_qubits)

    # Inicializa superposição uniforme
    qc.h(range(n_qubits))
    qc.barrier()

    # Aplica Oracle + Diffuser repetidamente
    oracle = create_oracle(n_qubits, target)
    diffuser = create_diffuser(n_qubits)

    for i in range(num_iterations):
        qc.compose(oracle, inplace=True)
        qc.compose(diffuser, inplace=True)
        if i < num_iterations - 1:
            qc.barrier()

    # Medição
    qc.barrier()
    qc.measure(range(n_qubits), range(n_qubits))

    # Executa
    simulator = AerSimulator()
    compiled = transpile(qc, simulator, optimization_level=2)

    print(f"  Circuito: {qc.num_qubits} qubits, {qc.size()} gates, profundidade {qc.depth()}")

    result = simulator.run(compiled, shots=shots).result()
    counts = result.get_counts()

    return counts, qc


if __name__ == "__main__":
    n_qubits = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    target = int(sys.argv[2]) if len(sys.argv) > 2 else 7
    shots = int(sys.argv[3]) if len(sys.argv) > 3 else 1024

    N = 2 ** n_qubits
    if target >= N:
        print(f"⚠️  Target {target} fora do espaço de busca (0 a {N-1}). Usando {N-1}.")
        target = N - 1

    print(f"Algoritmo de Grover — Busca Quântica")
    print(f"═" * 45)
    print(f"Qubits: {n_qubits} | Espaço: {N} itens | Alvo: {target}")
    print()

    start = time.perf_counter()
    counts, circuit = grovers_search(n_qubits, target, shots)
    elapsed = time.perf_counter() - start

    # Analisa resultados
    target_bitstring = format(target, f"0{n_qubits}b")
    target_count = counts.get(target_bitstring, 0)
    success_rate = target_count / shots * 100

    print()
    print(f"Resultados ({shots} shots):")
    sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    for bitstring, count in sorted_counts[:8]:
        marker = " ◄ ALVO" if bitstring == target_bitstring else ""
        bar = "█" * (count * 40 // shots)
        print(f"  |{bitstring}⟩ = {int(bitstring, 2):>3d}  [{count:>4d}] {bar}{marker}")

    if len(sorted_counts) > 8:
        print(f"  ... e mais {len(sorted_counts) - 8} estados")

    print()
    print(f"Taxa de sucesso: {success_rate:.1f}%")
    print(f"Tempo: {elapsed*1000:.4f}ms")

    if success_rate > 50:
        print(f"✅ Grover encontrou o alvo com alta probabilidade!")
    else:
        print(f"⚠️  Taxa de sucesso baixa — pode precisar de mais iterações.")
