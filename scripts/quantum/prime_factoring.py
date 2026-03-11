"""Quantum Prime Factoring — Shor's Algorithm (Educational/Simplified).

Implementação didática do algoritmo de Shor usando Qiskit 1.x.
Demonstra QFT, exponenciação modular e estimativa de fase quântica.

Complexidade quântica: O((log N)^3) vs O(exp((log N)^(1/3))) clássico.

Nota: Esta é uma versão simplificada para fins educacionais.
Para números grandes, o circuito real requer muitos qubits.
"""
import time
import sys
import math
from fractions import Fraction

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator


# ─── QFT ────────────────────────────────────────────────────────────────────

def qft(circuit: QuantumCircuit, qubits: list[int]) -> None:
    """Aplica Quantum Fourier Transform nos qubits especificados."""
    n = len(qubits)
    for i in range(n):
        circuit.h(qubits[i])
        for j in range(i + 1, n):
            angle = math.pi / (2 ** (j - i))
            circuit.cp(angle, qubits[j], qubits[i])
    # Swap qubits para ordem correta
    for i in range(n // 2):
        circuit.swap(qubits[i], qubits[n - 1 - i])


def inverse_qft(circuit: QuantumCircuit, qubits: list[int]) -> None:
    """Aplica a QFT inversa."""
    n = len(qubits)
    for i in range(n // 2):
        circuit.swap(qubits[i], qubits[n - 1 - i])
    for i in range(n - 1, -1, -1):
        for j in range(n - 1, i, -1):
            angle = -math.pi / (2 ** (j - i))
            circuit.cp(angle, qubits[j], qubits[i])
        circuit.h(qubits[i])


# ─── Modular Exponentiation ─────────────────────────────────────────────────

def controlled_mod_mult(circuit: QuantumCircuit, control: int, target_qubits: list[int],
                         a: int, N: int) -> None:
    """
    Aplica multiplicação modular controlada: |x⟩ → |a*x mod N⟩.
    Versão simplificada que usa swaps para a=2, N=15 como exemplo.
    """
    n = len(target_qubits)
    # Para o caso geral simplificado, usamos uma sequência de CNOTs
    # Isso funciona corretamente para exemplos pequenos (N=15)
    if a == 2 and N == 15:
        circuit.cswap(control, target_qubits[0], target_qubits[1])
        circuit.cswap(control, target_qubits[1], target_qubits[2])
        circuit.cswap(control, target_qubits[2], target_qubits[3])
    elif a == 4 and N == 15:
        circuit.cswap(control, target_qubits[0], target_qubits[2])
        circuit.cswap(control, target_qubits[1], target_qubits[3])
    elif a == 7 and N == 15:
        circuit.cswap(control, target_qubits[0], target_qubits[3])
        circuit.cswap(control, target_qubits[1], target_qubits[2])
        for q in target_qubits:
            circuit.cx(control, q)
    elif a == 8 and N == 15:
        circuit.cswap(control, target_qubits[3], target_qubits[2])
        circuit.cswap(control, target_qubits[2], target_qubits[1])
        circuit.cswap(control, target_qubits[1], target_qubits[0])
    elif a == 11 and N == 15:
        circuit.cswap(control, target_qubits[1], target_qubits[3])
        circuit.cswap(control, target_qubits[0], target_qubits[2])
        for q in target_qubits:
            circuit.cx(control, q)
    elif a == 13 and N == 15:
        circuit.cswap(control, target_qubits[0], target_qubits[3])
        circuit.cswap(control, target_qubits[1], target_qubits[2])
    else:
        # Fallback: identidade (para demonstração)
        pass


# ─── Shor's Algorithm ───────────────────────────────────────────────────────

def shors_order_finding(a: int, N: int, n_count: int = 4) -> QuantumCircuit:
    """
    Constrói o circuito de estimativa de ordem para o algoritmo de Shor.
    Encontra r tal que a^r ≡ 1 (mod N).

    Args:
        a: base para exponenciação modular
        N: número a fatorar
        n_count: número de qubits de contagem (precisão)
    """
    n_target = 4  # qubits para representar N (funciona para N≤15)

    qc = QuantumCircuit(n_count + n_target, n_count)

    # Inicializa registrador de contagem em superposição
    for q in range(n_count):
        qc.h(q)

    # Inicializa registrador target em |1⟩
    qc.x(n_count)

    # Aplica exponenciação modular controlada: a^(2^j) mod N
    for j in range(n_count):
        power = pow(a, 2 ** j, N)
        controlled_mod_mult(qc, j, list(range(n_count, n_count + n_target)), power, N)

    # Aplica QFT inversa no registrador de contagem
    inverse_qft(qc, list(range(n_count)))

    # Mede registrador de contagem
    qc.measure(range(n_count), range(n_count))

    return qc


def find_factors_from_order(a: int, N: int, r: int) -> tuple[int, int] | None:
    """Tenta extrair fatores de N dado a ordem r de a mod N."""
    if r % 2 != 0:
        return None

    guess1 = math.gcd(a ** (r // 2) - 1, N)
    guess2 = math.gcd(a ** (r // 2) + 1, N)

    if guess1 not in (1, N) and N % guess1 == 0:
        return guess1, N // guess1
    if guess2 not in (1, N) and N % guess2 == 0:
        return guess2, N // guess2

    return None


def shor_factor(N: int, max_attempts: int = 10) -> tuple[int, int] | None:
    """
    Executa o algoritmo de Shor para fatorar N.

    Retorna um par de fatores ou None se falhar.
    O algoritmo quântico pode precisar de múltiplas execuções.
    """
    if N % 2 == 0:
        return 2, N // 2

    # Verifica se é potência de primo
    for b in range(2, int(math.log2(N)) + 1):
        root = round(N ** (1 / b))
        if root ** b == N:
            return root, N // root

    simulator = AerSimulator()
    n_count = 2 * int(math.ceil(math.log2(N)))
    n_count = max(n_count, 4)
    n_count = min(n_count, 8)  # Limita para simulação viável

    valid_as = [a for a in range(2, N) if math.gcd(a, N) == 1]

    for attempt in range(min(max_attempts, len(valid_as))):
        a = valid_as[attempt % len(valid_as)]

        # Verifica se temos sorte (gcd não-trivial)
        gcd_val = math.gcd(a, N)
        if gcd_val > 1:
            return gcd_val, N // gcd_val

        print(f"  Tentativa {attempt + 1}: a={a}")

        qc = shors_order_finding(a, N, n_count)
        compiled = transpile(qc, simulator, optimization_level=2)
        result = simulator.run(compiled, shots=1024).result()
        counts = result.get_counts()

        # Extrai a ordem r a partir das medições
        measured_values = sorted(counts.items(), key=lambda x: x[1], reverse=True)

        for bitstring, count in measured_values[:4]:
            phase = int(bitstring, 2) / (2 ** n_count)
            if phase == 0:
                continue

            frac = Fraction(phase).limit_denominator(N)
            r = frac.denominator

            if r > 0 and pow(a, r, N) == 1:
                factors = find_factors_from_order(a, N, r)
                if factors:
                    return factors

    return None


# ─── Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    N = int(sys.argv[1]) if len(sys.argv) > 1 else 15

    print(f"Algoritmo de Shor — Fatoração Quântica")
    print(f"═" * 45)
    print(f"Número: {N}")
    print()

    if N < 4:
        print(f"N={N} é muito pequeno para fatorar.")
        sys.exit(0)

    # Mostra o circuito para referência
    print("Construindo circuito quântico...")
    sample_circuit = shors_order_finding(2, N, n_count=4)
    print(f"Qubits: {sample_circuit.num_qubits}")
    print(f"Gates: {sample_circuit.size()}")
    print(f"Profundidade: {sample_circuit.depth()}")
    print()

    start = time.perf_counter()
    result = shor_factor(N)
    elapsed = time.perf_counter() - start

    if result:
        p, q = result
        print()
        print(f"✅ Fatores encontrados: {p} × {q} = {p * q}")
        assert p * q == N, f"Verificação falhou: {p}×{q}={p*q} ≠ {N}"
    else:
        print(f"❌ Não foi possível fatorar {N} nas tentativas realizadas.")

    print(f"Tempo total: {elapsed*1000:.4f}ms")
