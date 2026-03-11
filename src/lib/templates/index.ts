export interface Template {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  classicalCode: string;
  quantumCode: string;
  classicalComplexity: string;
  quantumComplexity: string;
  classicalTime: string;
  quantumTime: string;
  explanation: string;
  inputDescription: string;
  tags: string[];
}

export const TEMPLATES: Template[] = [
  // ─── 1. Prime Factoring ──────────────────────────────────────────────
  {
    id: "prime-factoring",
    title: "Fatoração de Primos",
    subtitle: "Quebrando números em fatores primos",
    icon: "🔐",
    classicalCode: `import math
import time

def trial_division(n: int) -> list[int]:
    """
    Factor an integer n using trial division.
    We test every candidate divisor from 2 up to sqrt(n).
    """
    factors = []
    
    # Handle factor of 2 separately so we can skip even numbers later
    while n % 2 == 0:
        factors.append(2)
        n //= 2
    
    # Test odd divisors from 3 to sqrt(n)
    divisor = 3
    while divisor * divisor <= n:
        while n % divisor == 0:
            factors.append(divisor)
            n //= divisor
        divisor += 2
    
    # If n is still greater than 1, it must be a prime factor
    if n > 1:
        factors.append(n)
    
    return factors


if __name__ == "__main__":
    # Number to factorize
    N = 15  # Small example: 3 × 5
    
    print(f"Factoring N = {N} using trial division...")
    print(f"Worst-case complexity: O(√N) = O({math.isqrt(N)}) iterations\\n")
    
    start = time.perf_counter()
    result = trial_division(N)
    elapsed = time.perf_counter() - start
    
    print(f"Factors: {result}")
    print(f"Verification: {' × '.join(map(str, result))} = {math.prod(result)}")
    print(f"Time: {elapsed:.6f}s")
    
    # For large numbers (e.g. RSA-2048), trial division is infeasible.
    # A 2048-bit semiprime would require ~2^1024 iterations — more than
    # the number of atoms in the observable universe.
`,
    quantumCode: `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from math import gcd, log2

def c_amod15(a: int, power: int) -> QuantumCircuit:
    """
    Controlled unitary for modular exponentiation: |y⟩ → |y * a^power mod 15⟩.
    This is a simplified/educational version hardcoded for N=15.
    In a real implementation, this would be built from modular arithmetic gates.
    """
    if a not in [2, 4, 7, 8, 11, 13]:
        raise ValueError(f"Invalid base a={a} for mod 15")

    U = QuantumCircuit(4)

    for _ in range(power):
        if a in [2, 13]:
            U.swap(2, 3)
            U.swap(1, 2)
            U.swap(0, 1)
        if a in [7, 8]:
            U.swap(0, 1)
            U.swap(1, 2)
            U.swap(2, 3)
        if a in [4, 11]:
            U.swap(1, 3)
            U.swap(0, 2)
        if a in [7, 11, 13]:
            for q in range(4):
                U.x(q)

    U = U.to_gate()
    U.name = f"{a}^{power} mod 15"
    return U.control(1)


def qft_dagger(n: int) -> QuantumCircuit:
    """Inverse Quantum Fourier Transform on n qubits."""
    qc = QuantumCircuit(n)
    for qubit in range(n // 2):
        qc.swap(qubit, n - qubit - 1)
    for j in range(n):
        for m in range(j):
            qc.cp(-np.pi / float(2 ** (j - m)), m, j)
        qc.h(j)
    qc.name = "QFT†"
    return qc


def shors_algorithm(N: int = 15, a: int = 7) -> list[int]:
    """
    Shor's algorithm to factor N, using base a.
    Uses quantum phase estimation to find the period of a^x mod N.
    """
    # Number of counting qubits (precision of phase estimation)
    n_count = 8
    
    # Build the circuit: counting register + work register (4 qubits for mod 15)
    qc = QuantumCircuit(n_count + 4, n_count)
    
    # Initialize counting qubits in superposition
    for q in range(n_count):
        qc.h(q)
    
    # Initialize work register to |1⟩ (identity for multiplication)
    qc.x(n_count)
    
    # Apply controlled modular exponentiation: a^(2^j) mod N
    for j in range(n_count):
        controlled_U = c_amod15(a, 2**j)
        qc.append(controlled_U, [j] + list(range(n_count, n_count + 4)))
    
    # Apply inverse QFT to extract the phase (which encodes the period)
    qc.append(qft_dagger(n_count), range(n_count))
    
    # Measure counting register
    qc.measure(range(n_count), range(n_count))
    
    # Simulate
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    result = simulator.run(compiled, shots=1024).result()
    counts = result.get_counts()
    
    print(f"Circuit depth: {compiled.depth()}")
    print(f"Measurement outcomes (top 5):")
    sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    for bitstring, count in sorted_counts[:5]:
        phase = int(bitstring, 2) / (2**n_count)
        print(f"  |{bitstring}⟩ : {count} shots → phase ≈ {phase:.4f}")
    
    # Extract period from measured phases using continued fractions
    factors = set()
    for bitstring, count in sorted_counts[:4]:
        decimal = int(bitstring, 2)
        if decimal == 0:
            continue
        phase = decimal / (2**n_count)
        # Use continued fractions to find the period r
        from fractions import Fraction
        frac = Fraction(phase).limit_denominator(N)
        r = frac.denominator
        
        if r % 2 == 0:
            guess1 = gcd(a**(r // 2) - 1, N)
            guess2 = gcd(a**(r // 2) + 1, N)
            for guess in [guess1, guess2]:
                if guess not in [1, N] and N % guess == 0:
                    factors.add(guess)
    
    return sorted(factors)


if __name__ == "__main__":
    N = 15
    a = 7  # Coprime to N, gcd(a, N) = 1
    
    print(f"Shor's Algorithm — Factoring N = {N} with base a = {a}")
    print(f"Complexity: O((log N)³) = O({log2(N):.1f}³) ≈ O({log2(N)**3:.0f}) operations\\n")
    
    factors = shors_algorithm(N, a)
    
    print(f"\\nFactors found: {factors}")
    if factors:
        print(f"Verification: {' × '.join(map(str, factors))} = {np.prod(list(factors))}")
`,
    classicalComplexity: "O(√n)",
    quantumComplexity: "O((log n)³)",
    classicalTime: "~10¹⁵ anos para RSA-2048",
    quantumTime: "~horas para RSA-2048 (com hardware futuro)",
    explanation:
      "A fatoração de números grandes é a base da criptografia RSA. " +
      "Classicamente, o melhor algoritmo conhecido cresce exponencialmente com o tamanho do número, " +
      "mas o algoritmo de Shor usa interferência quântica pra encontrar o período de uma função modular " +
      "em tempo polinomial — transformando um problema de bilhões de anos em horas.",
    inputDescription:
      "Um número inteiro composto N para ser decomposto em fatores primos (ex: 15, 21, 35).",
    tags: ["cryptography", "factoring", "shor"],
  },

  // ─── 2. Database Search ──────────────────────────────────────────────
  {
    id: "database-search",
    title: "Busca em Banco de Dados",
    subtitle: "Encontrando um item em lista não-ordenada",
    icon: "🔍",
    classicalCode: `import time
import random

def linear_search(database: list, target: int) -> int | None:
    """
    Search for a target value in an unsorted list.
    Must check each element one by one — no shortcuts.
    Returns the index if found, None otherwise.
    """
    comparisons = 0
    
    for i, item in enumerate(database):
        comparisons += 1
        if item == target:
            print(f"Found target {target} at index {i}")
            print(f"Comparisons made: {comparisons}")
            return i
    
    print(f"Target {target} not found")
    print(f"Comparisons made: {comparisons}")
    return None


if __name__ == "__main__":
    # Create an unsorted database of N unique items
    N = 1000
    database = random.sample(range(N * 10), N)
    
    # Pick a random target that exists in the database
    target = random.choice(database)
    
    print(f"Linear search in unsorted list of {N} items")
    print(f"Looking for: {target}")
    print(f"Worst-case complexity: O(N) = O({N}) comparisons\\n")
    
    start = time.perf_counter()
    result = linear_search(database, target)
    elapsed = time.perf_counter() - start
    
    print(f"\\nTime: {elapsed:.6f}s")
    print(f"\\nOn average, linear search checks N/2 = {N // 2} elements.")
    print(f"For a database of 10^18 entries, this would take ~31.7 years.")
`,
    quantumCode: `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def create_oracle(n_qubits: int, target: int) -> QuantumCircuit:
    """
    Create a Grover oracle that marks the target state.
    The oracle flips the phase of the target state: |target⟩ → -|target⟩
    """
    oracle = QuantumCircuit(n_qubits)
    
    # Convert target to binary and flip qubits that should be |0⟩
    target_bits = format(target, f"0{n_qubits}b")[::-1]
    for i, bit in enumerate(target_bits):
        if bit == "0":
            oracle.x(i)
    
    # Multi-controlled Z gate: flip phase only when all qubits are |1⟩
    oracle.h(n_qubits - 1)
    oracle.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    oracle.h(n_qubits - 1)
    
    # Undo the X flips
    for i, bit in enumerate(target_bits):
        if bit == "0":
            oracle.x(i)
    
    oracle.name = "Oracle"
    return oracle


def create_diffuser(n_qubits: int) -> QuantumCircuit:
    """
    Grover's diffusion operator (inversion about the mean).
    Amplifies the amplitude of the marked state.
    """
    diffuser = QuantumCircuit(n_qubits)
    
    # Apply H to all qubits
    diffuser.h(range(n_qubits))
    
    # Apply X to all qubits
    diffuser.x(range(n_qubits))
    
    # Multi-controlled Z
    diffuser.h(n_qubits - 1)
    diffuser.mcx(list(range(n_qubits - 1)), n_qubits - 1)
    diffuser.h(n_qubits - 1)
    
    # Undo X and H
    diffuser.x(range(n_qubits))
    diffuser.h(range(n_qubits))
    
    diffuser.name = "Diffuser"
    return diffuser


def grovers_search(n_qubits: int, target: int) -> dict:
    """
    Grover's algorithm: search an unsorted database of 2^n items
    in O(√N) queries instead of O(N).
    """
    N = 2**n_qubits
    
    # Optimal number of Grover iterations ≈ π/4 × √N
    n_iterations = max(1, int(np.pi / 4 * np.sqrt(N)))
    
    print(f"Database size: N = 2^{n_qubits} = {N}")
    print(f"Target state: |{format(target, f'0{n_qubits}b')}⟩ (decimal {target})")
    print(f"Grover iterations: {n_iterations} (vs {N} classical comparisons)")
    
    # Build the circuit
    qc = QuantumCircuit(n_qubits, n_qubits)
    
    # Step 1: Create uniform superposition over all states
    qc.h(range(n_qubits))
    qc.barrier()
    
    # Step 2: Apply Grover iterations (oracle + diffuser)
    oracle = create_oracle(n_qubits, target)
    diffuser = create_diffuser(n_qubits)
    
    for i in range(n_iterations):
        qc.append(oracle, range(n_qubits))
        qc.append(diffuser, range(n_qubits))
        qc.barrier()
    
    # Step 3: Measure
    qc.measure(range(n_qubits), range(n_qubits))
    
    # Simulate
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    result = simulator.run(compiled, shots=1024).result()
    counts = result.get_counts()
    
    return counts


if __name__ == "__main__":
    n_qubits = 4  # Database of 2^4 = 16 items
    target = 11   # The item we're looking for
    
    print(f"Grover's Search Algorithm")
    print(f"Complexity: O(√N) vs classical O(N)\\n")
    
    counts = grovers_search(n_qubits, target)
    
    # Show results
    print(f"\\nMeasurement results (1024 shots):")
    sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    for bitstring, count in sorted_counts[:5]:
        decimal = int(bitstring, 2)
        marker = " ← TARGET" if decimal == target else ""
        probability = count / 1024 * 100
        print(f"  |{bitstring}⟩ (={decimal:>2d}): {count:>4d} shots ({probability:.1f}%){marker}")
    
    # The target state should have ~96% probability with optimal iterations
    target_bits = format(target, f"0{n_qubits}b")
    target_count = counts.get(target_bits, 0)
    print(f"\\nTarget found with {target_count/1024*100:.1f}% probability")
    print(f"Quantum speedup: √{2**n_qubits} = {np.sqrt(2**n_qubits):.0f}× fewer queries")
`,
    classicalComplexity: "O(n)",
    quantumComplexity: "O(√n)",
    classicalTime: "~31 anos para 10¹⁸ itens",
    quantumTime: "~5.6 horas para 10¹⁸ itens",
    explanation:
      "Numa lista desordenada, classicamente vc precisa olhar cada item um por um — não tem atalho. " +
      "O algoritmo de Grover usa superposição e interferência quântica pra amplificar a probabilidade " +
      "do item certo, encontrando ele em √N tentativas ao invés de N. " +
      "É um speedup quadrático garantido pra qualquer busca não-estruturada.",
    inputDescription:
      "Uma lista não-ordenada de N itens e um valor-alvo para buscar (ex: 16 itens, buscar o 11).",
    tags: ["search", "grover", "database"],
  },

  // ─── 3. Optimization — MaxCut ────────────────────────────────────────
  {
    id: "optimization-maxcut",
    title: "Otimização — MaxCut",
    subtitle: "Particionando grafos para maximizar cortes",
    icon: "✂️",
    classicalCode: `import itertools
import time

def maxcut_brute_force(edges: list[tuple[int, int]], n_nodes: int) -> tuple[str, int]:
    """
    Solve the MaxCut problem by brute force.
    Try all 2^n possible partitions and pick the one that maximizes
    the number of edges crossing the partition.
    
    MaxCut: partition graph nodes into two sets S and T such that
    the number of edges between S and T is maximized.
    """
    best_cut = 0
    best_partition = ""
    total_checked = 0
    
    # Iterate over all 2^n binary strings (each bit = set assignment)
    for i in range(2**n_nodes):
        partition = format(i, f"0{n_nodes}b")
        total_checked += 1
        
        # Count edges that cross the partition
        cut_value = 0
        for u, v in edges:
            if partition[u] != partition[v]:
                cut_value += 1
        
        if cut_value > best_cut:
            best_cut = cut_value
            best_partition = partition
    
    return best_partition, best_cut, total_checked


if __name__ == "__main__":
    # Define a small graph as edge list
    # Graph: pentagon with a diagonal
    #   0 --- 1
    #   |\\    |
    #   | \\   |
    #   |  \\  |
    #   3 --- 2
    #    \\   /
    #      4
    n_nodes = 5
    edges = [
        (0, 1), (1, 2), (2, 3), (3, 0),  # Square
        (0, 2),                            # Diagonal
        (2, 4), (3, 4),                    # Triangle at bottom
    ]
    
    print(f"MaxCut — Brute Force")
    print(f"Nodes: {n_nodes}, Edges: {len(edges)}")
    print(f"Complexity: O(2^n) = O({2**n_nodes}) partitions to check\\n")
    
    start = time.perf_counter()
    partition, cut_value, checked = maxcut_brute_force(edges, n_nodes)
    elapsed = time.perf_counter() - start
    
    # Display results
    set_s = [i for i, b in enumerate(partition) if b == "0"]
    set_t = [i for i, b in enumerate(partition) if b == "1"]
    
    print(f"Best partition: {partition}")
    print(f"  Set S: {set_s}")
    print(f"  Set T: {set_t}")
    print(f"  Max cut value: {cut_value} / {len(edges)} edges")
    print(f"  Partitions evaluated: {checked}")
    print(f"  Time: {elapsed:.6f}s")
    print(f"\\nFor n=50 nodes: 2^50 ≈ 10^15 partitions → ~years of computation")
`,
    quantumCode: `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator
from scipy.optimize import minimize

def maxcut_qaoa(edges: list[tuple[int, int]], n_nodes: int, p: int = 2) -> dict:
    """
    Solve MaxCut using QAOA (Quantum Approximate Optimization Algorithm).
    
    QAOA alternates between:
    - Cost layer: encodes the MaxCut objective (ZZ interactions on edges)
    - Mixer layer: explores the solution space (X rotations on all qubits)
    
    The variational parameters (gamma, beta) are optimized classically.
    """
    
    def create_qaoa_circuit(params: np.ndarray) -> QuantumCircuit:
        """Build a QAOA circuit with given parameters."""
        gammas = params[:p]
        betas = params[p:]
        
        qc = QuantumCircuit(n_nodes, n_nodes)
        
        # Initial state: uniform superposition
        qc.h(range(n_nodes))
        
        for layer in range(p):
            # Cost layer: apply exp(-i * gamma * C) where C is the MaxCut cost
            # For each edge (u,v): apply RZZ(gamma) = exp(-i * gamma * Z_u Z_v)
            for u, v in edges:
                qc.cx(u, v)
                qc.rz(2 * gammas[layer], v)
                qc.cx(u, v)
            
            qc.barrier()
            
            # Mixer layer: apply exp(-i * beta * B) where B = sum of X_i
            for qubit in range(n_nodes):
                qc.rx(2 * betas[layer], qubit)
            
            qc.barrier()
        
        qc.measure(range(n_nodes), range(n_nodes))
        return qc
    
    def compute_expectation(params: np.ndarray) -> float:
        """Evaluate the expected cut value for given QAOA parameters."""
        qc = create_qaoa_circuit(params)
        
        simulator = AerSimulator()
        compiled = transpile(qc, simulator)
        result = simulator.run(compiled, shots=1024).result()
        counts = result.get_counts()
        
        # Compute expected cut value from measurement outcomes
        total_cost = 0.0
        total_shots = sum(counts.values())
        
        for bitstring, count in counts.items():
            bits = bitstring[::-1]  # Qiskit uses little-endian
            cut = sum(1 for u, v in edges if bits[u] != bits[v])
            total_cost += cut * count / total_shots
        
        # Minimize negative cost (we want to maximize cuts)
        return -total_cost
    
    # Optimize variational parameters using classical optimizer
    print(f"QAOA with p={p} layers")
    print(f"Optimizing {2*p} variational parameters...\\n")
    
    # Random initial parameters
    np.random.seed(42)
    initial_params = np.random.uniform(0, np.pi, 2 * p)
    
    result = minimize(
        compute_expectation,
        initial_params,
        method="COBYLA",
        options={"maxiter": 200, "rhobeg": 0.5},
    )
    
    optimal_params = result.x
    print(f"Optimization converged: {result.success}")
    print(f"Optimal cost: {-result.fun:.2f} edges cut (expected value)")
    
    # Run final circuit with optimal parameters to get solution distribution
    final_qc = create_qaoa_circuit(optimal_params)
    simulator = AerSimulator()
    compiled = transpile(final_qc, simulator)
    final_result = simulator.run(compiled, shots=4096).result()
    counts = final_result.get_counts()
    
    return counts


if __name__ == "__main__":
    # Same graph as classical example
    n_nodes = 5
    edges = [
        (0, 1), (1, 2), (2, 3), (3, 0),
        (0, 2),
        (2, 4), (3, 4),
    ]
    
    print(f"MaxCut — QAOA (Quantum Approximate Optimization)")
    print(f"Nodes: {n_nodes}, Edges: {len(edges)}")
    print(f"Approximate complexity: O(√(2^n)) with quantum speedup\\n")
    
    counts = maxcut_qaoa(edges, n_nodes, p=2)
    
    # Analyze results
    print(f"\\nTop 5 solutions (4096 shots):")
    sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    
    for bitstring, count in sorted_counts[:5]:
        bits = bitstring[::-1]
        cut_value = sum(1 for u, v in edges if bits[u] != bits[v])
        set_s = [i for i, b in enumerate(bits) if b == "0"]
        set_t = [i for i, b in enumerate(bits) if b == "1"]
        prob = count / 4096 * 100
        print(f"  {bitstring} → cut={cut_value}, S={set_s}, T={set_t} ({prob:.1f}%)")
    
    # Best solution
    best = sorted_counts[0][0]
    best_bits = best[::-1]
    best_cut = sum(1 for u, v in edges if best_bits[u] != best_bits[v])
    print(f"\\nBest solution found: partition={best}, cut={best_cut}/{len(edges)} edges")
`,
    classicalComplexity: "O(2ⁿ)",
    quantumComplexity: "O(√(2ⁿ)) aproximado",
    classicalTime: "~anos para n=50 nós",
    quantumTime: "~minutos para n=50 nós (estimativa QAOA)",
    explanation:
      "O problema MaxCut é NP-difícil — classicamente, a única garantia de solução ótima é testar todas as 2ⁿ partições possíveis. " +
      "O QAOA é um algoritmo quântico variacional que explora superposição pra avaliar múltiplas partições simultaneamente, " +
      "convergindo pra soluções próximas da ótima com muito menos iterações. " +
      "É um dos algoritmos mais promissores pra rodar em hardware quântico atual (NISQ).",
    inputDescription:
      "Um grafo definido por lista de arestas e número de nós (ex: 5 nós, 7 arestas).",
    tags: ["optimization", "qaoa", "graph"],
  },

  // ─── 4. Random Number Generation ─────────────────────────────────────
  {
    id: "random-generation",
    title: "Geração de Números Aleatórios",
    subtitle: "Pseudo-random vs aleatoriedade verdadeira",
    icon: "🎲",
    classicalCode: `import random
import time
import hashlib

def pseudo_random_demo(n_numbers: int = 10, seed: int = 42) -> list[int]:
    """
    Generate pseudo-random numbers using Python's Mersenne Twister PRNG.
    
    Key limitation: given the same seed, the sequence is IDENTICAL every time.
    This is deterministic — not truly random. An attacker who knows the seed
    (or observes enough outputs) can predict all future values.
    """
    rng = random.Random(seed)
    numbers = [rng.randint(0, 255) for _ in range(n_numbers)]
    return numbers


def demonstrate_determinism(seed: int = 42):
    """Show that PRNG produces identical sequences from the same seed."""
    print("=== Demonstrating Determinism ===")
    print(f"Seed: {seed}\\n")
    
    # Run 1
    seq1 = pseudo_random_demo(10, seed)
    print(f"Run 1: {seq1}")
    
    # Run 2 — same seed → same output
    seq2 = pseudo_random_demo(10, seed)
    print(f"Run 2: {seq2}")
    
    print(f"\\nIdentical? {seq1 == seq2}  ← THIS is the problem")
    print(f"A PRNG is a deterministic function. Same input → same output. Always.")


def generate_random_bytes(n_bytes: int = 32) -> bytes:
    """
    Generate pseudo-random bytes and show the internal state dependency.
    In production, os.urandom() or secrets module should be used,
    but even those rely on OS entropy pools (not true randomness).
    """
    random.seed(time.time_ns())  # Seed with nanosecond timestamp
    return bytes([random.randint(0, 255) for _ in range(n_bytes)])


if __name__ == "__main__":
    print("Classical Pseudo-Random Number Generation (PRNG)")
    print("Algorithm: Mersenne Twister (MT19937)")
    print("Period: 2^19937 - 1 (very long, but still deterministic)\\n")
    
    demonstrate_determinism()
    
    print(f"\\n\\n=== Practical Generation ===")
    random_bytes = generate_random_bytes(16)
    hex_str = random_bytes.hex()
    print(f"16 random bytes: {hex_str}")
    print(f"As integers: {list(random_bytes)}")
    
    # Show why this matters for cryptography
    print(f"\\n=== Why This Matters ===")
    print(f"PRNGs are fine for simulations and games.")
    print(f"But for cryptographic keys, you need TRUE randomness.")
    print(f"Classical computers can only approximate it using entropy sources")
    print(f"(mouse movements, disk timing, thermal noise, etc).")
`,
    quantumCode: `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator

def quantum_random_bits(n_bits: int) -> str:
    """
    Generate truly random bits using quantum measurement.
    
    How it works:
    1. Prepare qubits in |0⟩ state
    2. Apply Hadamard gate → puts each qubit in superposition: (|0⟩ + |1⟩)/√2
    3. Measure → each qubit collapses to 0 or 1 with exactly 50% probability
    
    This randomness is FUNDAMENTAL — guaranteed by quantum mechanics.
    No seed, no algorithm, no pattern. Pure entropy from nature.
    """
    qc = QuantumCircuit(n_bits, n_bits)
    
    # Put every qubit into equal superposition
    qc.h(range(n_bits))
    
    # Measure — the act of measurement creates randomness
    qc.measure(range(n_bits), range(n_bits))
    
    # Run on simulator (on real hardware, this would be true QRNG)
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    
    # Single shot = one truly random bitstring
    result = simulator.run(compiled, shots=1).result()
    counts = result.get_counts()
    
    return list(counts.keys())[0]


def quantum_random_int(min_val: int, max_val: int) -> int:
    """Generate a random integer in [min_val, max_val] using quantum bits."""
    range_size = max_val - min_val + 1
    n_bits = int(np.ceil(np.log2(range_size)))
    
    # Rejection sampling: generate until we get a value in range
    while True:
        bits = quantum_random_bits(n_bits)
        value = int(bits, 2)
        if value < range_size:
            return value + min_val


def quantum_random_bytes(n_bytes: int) -> bytes:
    """Generate n random bytes using quantum measurement."""
    # Generate all bits at once for efficiency
    n_bits = n_bytes * 8
    
    # Split into chunks (simulators have qubit limits)
    chunk_size = 20  # Most simulators handle ~20-30 qubits
    all_bits = ""
    
    for i in range(0, n_bits, chunk_size):
        bits_needed = min(chunk_size, n_bits - i)
        all_bits += quantum_random_bits(bits_needed)
    
    # Convert bitstring to bytes
    byte_list = []
    for i in range(0, len(all_bits), 8):
        byte_val = int(all_bits[i:i+8], 2)
        byte_list.append(byte_val)
    
    return bytes(byte_list[:n_bytes])


def test_uniformity(n_samples: int = 1000):
    """
    Statistical test: verify that quantum random bits are uniformly distributed.
    Generate many single-qubit measurements and check the 0/1 ratio.
    """
    qc = QuantumCircuit(1, 1)
    qc.h(0)
    qc.measure(0, 0)
    
    simulator = AerSimulator()
    compiled = transpile(qc, simulator)
    result = simulator.run(compiled, shots=n_samples).result()
    counts = result.get_counts()
    
    zeros = counts.get("0", 0)
    ones = counts.get("1", 0)
    
    return zeros, ones


if __name__ == "__main__":
    print("Quantum Random Number Generation (QRNG)")
    print("Source: Quantum superposition + measurement collapse\\n")
    
    # Generate random bits
    print("=== Random Bit Generation ===")
    for i in range(5):
        bits = quantum_random_bits(8)
        decimal = int(bits, 2)
        print(f"  Run {i+1}: {bits} (decimal: {decimal:>3d})")
    
    print(f"\\nEach run produces a DIFFERENT result — no seed, no pattern.")
    
    # Generate random bytes
    print(f"\\n=== Random Bytes ===")
    rand_bytes = quantum_random_bytes(16)
    print(f"16 quantum random bytes: {rand_bytes.hex()}")
    print(f"As integers: {list(rand_bytes)}")
    
    # Random integers
    print(f"\\n=== Random Integers (1-100) ===")
    for i in range(5):
        val = quantum_random_int(1, 100)
        print(f"  Roll {i+1}: {val}")
    
    # Uniformity test
    print(f"\\n=== Uniformity Test (1000 single-qubit measurements) ===")
    zeros, ones = test_uniformity(1000)
    print(f"  |0⟩: {zeros} ({zeros/10:.1f}%)")
    print(f"  |1⟩: {ones} ({ones/10:.1f}%)")
    print(f"  Ratio: {zeros/ones:.4f} (ideal: 1.0000)")
    print(f"  Deviation: {abs(zeros - ones) / 1000 * 100:.1f}%")
    
    print(f"\\n=== Why Quantum Randomness Matters ===")
    print(f"Classical PRNG: deterministic, predictable with enough information.")
    print(f"Quantum RNG: fundamentally unpredictable, guaranteed by physics.")
    print(f"Applications: cryptographic keys, Monte Carlo simulations, fair lotteries.")
`,
    classicalComplexity: "Determinístico (PRNG)",
    quantumComplexity: "Aleatoriedade verdadeira",
    classicalTime: "Instantâneo (mas previsível)",
    quantumTime: "Instantâneo (e imprevisível)",
    explanation:
      "Computadores clássicos não conseguem gerar números verdadeiramente aleatórios — eles usam algoritmos determinísticos (PRNGs) " +
      "que produzem sequências que parecem aleatórias mas são completamente previsíveis se vc souber a seed. " +
      "Na computação quântica, a aleatoriedade é fundamental: medir um qubit em superposição gera um resultado genuinamente imprevisível, " +
      "garantido pelas leis da física.",
    inputDescription:
      "Quantidade de bits/bytes aleatórios a gerar e opcionalmente um range (ex: inteiro entre 1 e 100).",
    tags: ["random", "entropy", "basics"],
  },
];
