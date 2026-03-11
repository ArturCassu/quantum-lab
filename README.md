# ⚛️ Quantum Lab

Plataforma interativa para explorar computação quântica vs clássica. Compare algoritmos lado a lado, visualize circuitos quânticos e entenda na prática por que quantum importa.

![Quantum Lab Screenshot](./docs/screenshot.png)

## 🚀 Getting Started

### Frontend (Next.js)

```bash
# Instala dependências
npm install

# Roda em modo dev
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Scripts Python (Algoritmos)

Os scripts de comparação ficam em `scripts/`. Cada algoritmo tem uma versão clássica e uma quântica.

```bash
# Instala dependências Python
pip install -r scripts/requirements.txt

# Roda um script
python scripts/classical/prime_factoring.py 15
python scripts/quantum/prime_factoring.py 15
```

#### Scripts disponíveis

| Problema | Clássico | Quântico | Speedup |
|----------|----------|----------|---------|
| Fatoração de primos | `classical/prime_factoring.py` | `quantum/prime_factoring.py` (Shor) | Exponencial |
| Busca | `classical/search.py` | `quantum/search.py` (Grover) | Quadrático (√N) |
| MaxCut | `classical/maxcut.py` | `quantum/maxcut.py` (QAOA) | Aproximação |
| Números aleatórios | `classical/random_gen.py` | `quantum/random_gen.py` | Aleatoriedade real |

Todos os scripts:
- São auto-contidos e rodam com `python script.py`
- Aceitam argumentos opcionais de CLI (ex: `python script.py 21`)
- Incluem timing built-in para comparação
- Têm docstrings explicando o que fazem

## 🏗️ Arquitetura

```
quantum-lab/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home / dashboard
│   └── lab/
│       └── [algorithm]/    # Páginas dinâmicas por algoritmo
│           └── page.tsx
├── components/
│   ├── ui/                 # Componentes base (shadcn/ui)
│   ├── circuit-viewer/     # Visualizador de circuitos quânticos
│   ├── comparison-panel/   # Painel lado a lado (clássico vs quântico)
│   └── ai-playground/      # Chat com IA sobre quantum
├── lib/
│   ├── algorithms/         # Lógica dos algoritmos (TypeScript)
│   ├── quantum/            # Helpers de circuitos quânticos
│   └── utils.ts
├── scripts/
│   ├── classical/          # Algoritmos clássicos (Python)
│   ├── quantum/            # Algoritmos quânticos (Python, Qiskit)
│   └── requirements.txt
├── public/
└── docs/
```

### Stack

- **Frontend:** Next.js 14+, React, TypeScript, Tailwind CSS
- **UI:** shadcn/ui
- **Quantum:** Qiskit 1.x (Python) — circuitos, simulação, visualização
- **AI:** Integração com LLM para explicações interativas

## 🤖 AI Playground

O Quantum Lab inclui um playground de IA onde você pode:

- **Perguntar sobre algoritmos quânticos** — "como o Shor encontra fatores?"
- **Pedir explicações visuais** — a IA gera circuitos e diagramas
- **Comparar abordagens** — "por que Grover é √N e não log N?"
- **Explorar conceitos** — superposição, emaranhamento, interferência, decoerência

O playground usa um LLM com contexto especializado em computação quântica, pré-carregado com informações sobre cada algoritmo implementado no lab.

## 📚 Referências

- [Qiskit Documentation](https://docs.quantum.ibm.com/)
- [Qiskit Textbook](https://github.com/Qiskit/textbook)
- [IBM Quantum](https://quantum.ibm.com/)

## 📄 Licença

MIT
