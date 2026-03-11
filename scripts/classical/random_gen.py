"""Classical Random Number Generator — PRNG (Pseudo-Random).

Demonstra que geradores clássicos são determinísticos:
mesma seed = mesma sequência. Não é verdadeiramente aleatório.
"""
import time
import sys
import random


def generate_prng(n: int, seed: int) -> list[int]:
    """Gera n números pseudo-aleatórios (0-255) com a seed dada."""
    rng = random.Random(seed)
    return [rng.randint(0, 255) for _ in range(n)]


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 16
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 42

    print(f"Gerador Pseudo-Aleatório (PRNG)")
    print(f"Algoritmo: Mersenne Twister (Python random)")
    print(f"Quantidade: {n} bytes | Seed: {seed}")
    print()

    # Primeira execução
    start = time.perf_counter()
    result1 = generate_prng(n, seed)
    elapsed1 = time.perf_counter() - start

    # Segunda execução com MESMA seed
    start = time.perf_counter()
    result2 = generate_prng(n, seed)
    elapsed2 = time.perf_counter() - start

    print(f"Execução 1: {result1}")
    print(f"Execução 2: {result2}")
    print()

    if result1 == result2:
        print("⚠️  Resultados IDÊNTICOS — mesma seed produz mesma sequência.")
        print("   Isso prova que NÃO é verdadeiramente aleatório.")
    else:
        print("✅ Resultados diferentes (isso não deveria acontecer com mesma seed!).")

    print()
    print(f"Tempo execução 1: {elapsed1*1000:.4f}ms")
    print(f"Tempo execução 2: {elapsed2*1000:.4f}ms")

    # Mostra distribuição
    print()
    print("Distribuição por quartil (0-63, 64-127, 128-191, 192-255):")
    quartiles = [0, 0, 0, 0]
    for val in result1:
        quartiles[val // 64] += 1
    for i, count in enumerate(quartiles):
        bar = "█" * count
        print(f"  Q{i+1}: {bar} ({count})")
