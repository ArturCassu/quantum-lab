# Quantum Lab — Copilot Instructions

## Project Overview

Quantum Lab is an interactive platform for exploring quantum vs classical computing. It features side-by-side algorithm comparisons, quantum circuit visualization, and an AI playground for learning.

## Stack

- **Frontend:** Next.js 14+ (App Router), React 18+, TypeScript 5+
- **Styling:** Tailwind CSS + shadcn/ui components
- **Quantum Backend:** Python 3.11+, Qiskit 1.x, qiskit-aer
- **Package Manager:** npm (frontend), pip (Python scripts)

## Project Structure

```
quantum-lab/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                 # shadcn/ui base components
│   ├── circuit-viewer/     # Quantum circuit visualization
│   ├── comparison-panel/   # Classical vs Quantum side-by-side
│   └── ai-playground/      # AI chat for quantum concepts
├── lib/                    # Shared utilities and logic
│   ├── algorithms/         # Algorithm implementations (TS)
│   ├── quantum/            # Quantum circuit helpers
│   └── utils.ts
├── scripts/
│   ├── classical/          # Classical algorithm scripts (Python)
│   └── quantum/            # Quantum algorithm scripts (Python, Qiskit)
└── public/
```

## Conventions

### TypeScript / React

- Use functional components with hooks
- Prefer `interface` over `type` for component props
- Use named exports, not default exports
- File naming: `kebab-case.tsx` for components, `camelCase.ts` for utilities
- Colocate tests next to source files: `component.test.tsx`
- Use `cn()` from `lib/utils` for conditional class merging
- Server Components by default; add `"use client"` only when needed

### Styling

- Tailwind CSS utility classes — avoid custom CSS unless absolutely necessary
- Use shadcn/ui components from `components/ui/`
- Design tokens via CSS variables in `globals.css`
- Responsive: mobile-first approach
- Dark mode support via `class` strategy

### Python Scripts

- Python 3.11+ with type hints
- Scripts must be self-contained and runnable: `python scripts/classical/search.py`
- All scripts include timing and accept optional CLI arguments
- Docstrings on all functions explaining the algorithm and complexity
- Use Qiskit 1.x API (not deprecated 0.x patterns)
- `qiskit-aer` for simulation (AerSimulator, not legacy Aer)

### State Management

- React Context for global UI state (theme, sidebar)
- URL params for algorithm selection and configuration
- No external state library unless complexity demands it

### API / Data Flow

- Python scripts are executed server-side via API routes or child_process
- Results are returned as JSON to the frontend
- Circuit diagrams can be rendered client-side or as SVG from Python

## Key Patterns

### Algorithm Comparison

Each algorithm has:
1. A classical implementation (Python, `scripts/classical/`)
2. A quantum implementation (Python + Qiskit, `scripts/quantum/`)
3. A frontend page (`app/lab/[algorithm]/page.tsx`)
4. A comparison panel showing both results side-by-side

### Circuit Visualization

- Quantum circuits are described as JSON or Qiskit circuit objects
- Frontend renders them using custom SVG components
- Show gate-by-gate execution with state vector visualization

### AI Playground

- Chat interface for asking questions about quantum computing
- Context-aware: knows which algorithm the user is viewing
- Generates circuit diagrams and explanations on demand

## Do NOT

- Use Qiskit 0.x deprecated APIs (e.g., `execute()`, `Aer.get_backend()`)
- Use `any` type in TypeScript — always provide proper types
- Use inline styles — use Tailwind classes
- Create files in `pages/` — this project uses App Router (`app/`)
- Import from `@/components/ui` without checking if the component exists

## Dependencies

### Frontend (npm)
- next, react, react-dom
- tailwindcss, postcss, autoprefixer
- class-variance-authority, clsx, tailwind-merge (for cn())
- lucide-react (icons)
- @radix-ui/* (via shadcn/ui)

### Python (pip)
- qiskit >= 1.0
- qiskit-aer >= 0.15
- numpy
