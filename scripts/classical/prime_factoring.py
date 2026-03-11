"""Classical Prime Factoring — Trial Division"""
import time
import sys

def trial_division(n: int) -> list[int]:
    """Find prime factors using trial division. O(√n)"""
    factors = []
    d = 2
    while d * d <= n:
        while n % d == 0:
            factors.append(d)
            n //= d
        d += 1
    if n > 1:
        factors.append(n)
    return factors

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    print(f"Fatorando {n}...")
    start = time.perf_counter()
    factors = trial_division(n)
    elapsed = time.perf_counter() - start
    print(f"Fatores: {factors}")
    print(f"Tempo: {elapsed*1000:.4f}ms")
