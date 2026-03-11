"""Classical Linear Search — O(n) brute force search in unsorted list."""
import time
import sys
import random


def linear_search(lst: list[int], target: int) -> int | None:
    """Search for target in lst. Returns index or None."""
    for i, val in enumerate(lst):
        if val == target:
            return i
    return None


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1_000_000
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 42

    random.seed(seed)
    data = list(range(n))
    random.shuffle(data)

    # Pick a random target that exists in the list
    target = random.randint(0, n - 1)

    print(f"Busca linear em lista de {n:,} elementos")
    print(f"Procurando: {target}")

    start = time.perf_counter()
    idx = linear_search(data, target)
    elapsed = time.perf_counter() - start

    if idx is not None:
        print(f"Encontrado no índice {idx}")
    else:
        print("Não encontrado")
    print(f"Tempo: {elapsed*1000:.4f}ms")
