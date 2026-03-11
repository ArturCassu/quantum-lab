"""Classical MaxCut — Brute Force (enumerate all 2^n partitions)."""
import time
import sys
import itertools


def maxcut_brute_force(num_nodes: int, edges: list[tuple[int, int, float]]) -> tuple[int, list[int]]:
    """
    Solve MaxCut by enumerating all possible partitions.
    Each node is assigned to set 0 or set 1.
    An edge is "cut" if its endpoints are in different sets.

    Returns (max_cut_value, best_partition).
    Complexity: O(2^n * |E|)
    """
    best_cut = -1
    best_partition = []

    for bits in itertools.product([0, 1], repeat=num_nodes):
        cut_value = 0
        for u, v, w in edges:
            if bits[u] != bits[v]:
                cut_value += w
        if cut_value > best_cut:
            best_cut = cut_value
            best_partition = list(bits)

    return best_cut, best_partition


def build_sample_graph(n: int) -> tuple[int, list[tuple[int, int, float]]]:
    """Build a sample graph with n nodes and some edges."""
    edges = []
    for i in range(n):
        for j in range(i + 1, n):
            if (i + j) % 2 == 0 or j == i + 1:
                edges.append((i, j, 1.0))
    return n, edges


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 6

    if n > 20:
        print(f"⚠️  n={n} geraria {2**n:,} partições. Limitando a 20.")
        n = 20

    num_nodes, edges = build_sample_graph(n)

    print(f"MaxCut — Força bruta")
    print(f"Nós: {num_nodes}, Arestas: {len(edges)}")
    print(f"Partições a avaliar: {2**num_nodes:,}")
    print()

    start = time.perf_counter()
    best_cut, best_partition = maxcut_brute_force(num_nodes, edges)
    elapsed = time.perf_counter() - start

    set_0 = [i for i, b in enumerate(best_partition) if b == 0]
    set_1 = [i for i, b in enumerate(best_partition) if b == 1]

    print(f"Melhor corte: {best_cut}")
    print(f"Conjunto 0: {set_0}")
    print(f"Conjunto 1: {set_1}")
    print(f"Tempo: {elapsed*1000:.4f}ms")
