"""Quantum MaxCut — QAOA (Quantum Approximate Optimization Algorithm).

Resolve o problema MaxCut usando QAOA com Qiskit 1.x.
Constrói o hamiltoniano de custo, mixer e circuito variacional,
e otimiza os parâmetros (gamma, beta) classicamente.

QAOA é um algoritmo híbrido quântico-clássico:
- Parte quântica: prepara estados e avalia a função custo
- Parte clássica: otimiza parâmetros do circuito
"""
import time
import sys
import math
import itertools

import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator


# ─── Graph ──────────────────────────────────────────────────────────────────

def build_sample_graph(n: int) -> list[tuple[int, int, float]]:
    """Constrói um grafo de exemplo com n nós."""
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if (i + j) % 2 == 0 or j == i + 1:
                edges.append((i, j, 1.0))
    return edges


# ─── QAOA Circuit ───────────────────────────────────────────────────────────

def cost_layer(qc: QuantumCircuit, gamma: float, edges: list[tuple[int, int, float]]) -> None:
    """
    Aplica o operador de custo exp(-i * gamma * C).

    Para MaxCut, C = Σ_{(i,j)∈E} (1 - Z_i Z_j) / 2.
    O operador unitário correspondente usa gates ZZ:
    exp(-i * gamma * Z_i Z_j / 2) = CNOT(i,j) · Rz(gamma)(j) · CNOT(i,j)
    """
    for u, v, w in edges:
        qc.cx(u, v)
        qc.rz(2 * gamma * w, v)
        qc.cx(u, v)


def mixer_layer(qc: QuantumCircuit, beta: float, n_qubits: int) -> None:
    """
    Aplica o operador mixer exp(-i * beta * B).

    B = Σ_i X_i (mixer padrão).
    exp(-i * beta * X_i) = Rx(2*beta) em cada qubit.
    """
    for i in range(n_qubits):
        qc.rx(2 * beta, i)


def qaoa_circuit(n_qubits: int, edges: list[tuple[int, int, float]],
                  gammas: list[float], betas: list[float]) -> QuantumCircuit:
    """
    Constrói o circuito QAOA completo.

    Args:
        n_qubits: número de qubits (= nós do grafo)
        edges: arestas do grafo [(u, v, weight), ...]
        gammas: parâmetros do operador de custo (um por camada)
        betas: parâmetros do mixer (um por camada)
    """
    p = len(gammas)  # número de camadas QAOA
    qc = QuantumCircuit(n_qubits, n_qubits)

    # Estado inicial: superposição uniforme
    qc.h(range(n_qubits))

    # Camadas QAOA alternadas
    for layer in range(p):
        qc.barrier()
        cost_layer(qc, gammas[layer], edges)
        qc.barrier()
        mixer_layer(qc, betas[layer], n_qubits)

    # Medição
    qc.barrier()
    qc.measure(range(n_qubits), range(n_qubits))

    return qc


# ─── Evaluation ─────────────────────────────────────────────────────────────

def evaluate_cut(bitstring: str, edges: list[tuple[int, int, float]]) -> float:
    """Calcula o valor do corte para uma dada partição."""
    bits = [int(b) for b in bitstring[::-1]]
    cut_value = 0.0
    for u, v, w in edges:
        if bits[u] != bits[v]:
            cut_value += w
    return cut_value


def compute_expectation(counts: dict, edges: list[tuple[int, int, float]]) -> float:
    """Calcula o valor esperado do corte a partir das medições."""
    total_shots = sum(counts.values())
    expectation = 0.0
    for bitstring, count in counts.items():
        cut = evaluate_cut(bitstring, edges)
        expectation += cut * count / total_shots
    return expectation


def brute_force_maxcut(n_qubits: int, edges: list[tuple[int, int, float]]) -> tuple[float, str]:
    """Encontra o MaxCut ótimo por força bruta (para comparação)."""
    best_cut = -1.0
    best_bitstring = ""
    for bits in itertools.product([0, 1], repeat=n_qubits):
        bitstring = "".join(str(b) for b in bits)
        cut = evaluate_cut(bitstring[::-1], edges)
        if cut > best_cut:
            best_cut = cut
            best_bitstring = bitstring
    return best_cut, best_bitstring


# ─── Optimization ──────────────────────────────────────────────────────────

def optimize_qaoa(n_qubits: int, edges: list[tuple[int, int, float]],
                   p: int = 1, n_samples: int = 50, shots: int = 1024) -> dict:
    """
    Otimiza parâmetros QAOA usando grid search simples.

    Para produção, use scipy.optimize.minimize (COBYLA/SPSA).
    Aqui usamos grid search para transparência didática.
    """
    simulator = AerSimulator()
    best_expectation = -1.0
    best_gammas = []
    best_betas = []
    best_counts = {}

    # Grid search sobre gamma e beta
    gamma_range = np.linspace(0, 2 * math.pi, n_samples)
    beta_range = np.linspace(0, math.pi, n_samples)

    total_evals = 0

    if p == 1:
        for gamma in gamma_range:
            for beta in beta_range:
                qc = qaoa_circuit(n_qubits, edges, [gamma], [beta])
                compiled = transpile(qc, simulator, optimization_level=2)
                result = simulator.run(compiled, shots=shots).result()
                counts = result.get_counts()
                expectation = compute_expectation(counts, edges)
                total_evals += 1

                if expectation > best_expectation:
                    best_expectation = expectation
                    best_gammas = [gamma]
                    best_betas = [beta]
                    best_counts = counts
    else:
        # Para p > 1, usa amostragem aleatória (mais prático)
        rng = np.random.default_rng(42)
        for _ in range(n_samples * n_samples):
            gammas = rng.uniform(0, 2 * math.pi, p).tolist()
            betas = rng.uniform(0, math.pi, p).tolist()

            qc = qaoa_circuit(n_qubits, edges, gammas, betas)
            compiled = transpile(qc, simulator, optimization_level=2)
            result = simulator.run(compiled, shots=shots).result()
            counts = result.get_counts()
            expectation = compute_expectation(counts, edges)
            total_evals += 1

            if expectation > best_expectation:
                best_expectation = expectation
                best_gammas = gammas
                best_betas = betas
                best_counts = counts

    return {
        "expectation": best_expectation,
        "gammas": best_gammas,
        "betas": best_betas,
        "counts": best_counts,
        "total_evals": total_evals,
    }


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    p = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    n_samples = int(sys.argv[3]) if len(sys.argv) > 3 else 20

    if n > 10:
        print(f"⚠️  n={n} é grande demais para simulação. Limitando a 10.")
        n = 10

    edges = build_sample_graph(n)

    print(f"QAOA MaxCut — Otimização Quântica Aproximada")
    print(f"═" * 50)
    print(f"Nós: {n} | Arestas: {len(edges)} | Camadas QAOA (p): {p}")
    print(f"Grid: {n_samples}x{n_samples} = {n_samples**2} avaliações")
    print()

    # Solução ótima (força bruta) para comparação
    print("Calculando solução ótima (força bruta)...")
    optimal_cut, optimal_bitstring = brute_force_maxcut(n, edges)
    print(f"  Corte ótimo: {optimal_cut}")
    print(f"  Partição ótima: |{optimal_bitstring}⟩")
    print()

    # QAOA
    print("Executando QAOA...")
    start = time.perf_counter()
    result = optimize_qaoa(n, edges, p=p, n_samples=n_samples)
    elapsed = time.perf_counter() - start

    print()
    print(f"Resultado QAOA:")
    print(f"  Valor esperado do corte: {result['expectation']:.4f}")
    print(f"  Razão de aproximação: {result['expectation']/optimal_cut:.4f}")
    print(f"  Parâmetros: γ={[f'{g:.3f}' for g in result['gammas']]}, β={[f'{b:.3f}' for b in result['betas']]}")
    print(f"  Avaliações: {result['total_evals']}")
    print()

    # Top resultados
    sorted_counts = sorted(result["counts"].items(), key=lambda x: x[1], reverse=True)
    total_shots = sum(result["counts"].values())
    print("Top partições medidas:")
    for bitstring, count in sorted_counts[:5]:
        cut = evaluate_cut(bitstring, edges)
        pct = count / total_shots * 100
        marker = " ◄ ÓTIMO" if cut == optimal_cut else ""
        print(f"  |{bitstring}⟩  corte={cut:.0f}  [{count:>4d} shots, {pct:>5.1f}%]{marker}")

    print()
    print(f"Tempo total: {elapsed*1000:.4f}ms")
