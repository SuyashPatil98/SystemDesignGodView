# Tech Galaxy

A 3D interactive mindmap of modern engineering — System Design, Distributed Systems, Data Engineering, MLOps, GenAI, and everything in between.

Not a flashcard app. A **thinking instrument** for engineers who want to see how every concept fits together — and what fails in production.

---

## Run

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

Build for production: `npm run build`.

Requires Node 18+.

---

## What's inside

- **3D galactic layout** (Three.js / React Three Fiber). 26 domains placed on a Fibonacci sphere; subdomains orbit them on tilted rings; concepts cluster around subdomains.
- **300+ nodes** with structured content fields: short explanation, why it matters, mental model, tradeoffs, failure modes, metrics to monitor, design questions, interview & production framing.
- **Cross-domain edges** — typed relationships (related, depends-on, implements, tradeoff-of, fails-as) with curved Bezier rendering.
- **8 modes** that re-filter and overlay the same galaxy:
  - **Galaxy** — overview of the entire universe
  - **Learning paths** — 9 curated sequences (Backend → System Design, MLOps, GenAI, Staff-eng architecture, Interview prep, …)
  - **Projects** — 10 non-generic project ideas with components, tools, and design questions
  - **Tradeoffs** — 16 classic tradeoff comparisons with pros/cons, examples, interview & production framing
  - **Failure modes** — 24 failure modes with symptoms, prevention, detection metrics
  - **Metrics** — 35 metrics across reliability / ML / LLM / data quality
  - **Patterns** — 25 architectural patterns
  - **Tools** — 50+ tools mapped to the concepts they implement
- **Search** (`/`) — fuzzy across name, tags, explanations
- **Filters** — domain, difficulty, layer, interview/production relevance
- **Side panel** — every content field for the selected node, with click-through to related nodes
- **Minimap** with click-to-navigate
- **Keyboard shortcuts** — `/`, `Esc`, `F`, `C`, `M`, `1-8`

---

## Architecture

```
src/
├── App.tsx              composes everything
├── store/useGraphStore  selection, mode, filters, camera state
│
├── data/
│   ├── schema.ts        types: GNode, GEdge, LearningPath, ProjectIdea, Tradeoff
│   ├── domains.ts       the 26 top-level domains + hue
│   ├── nodes/           one file per flagship domain + scaffolds.ts for the rest
│   ├── tools.ts         50+ tool nodes
│   ├── metrics.ts       35 metric nodes
│   ├── patterns.ts      25 pattern nodes
│   ├── failureModes.ts  24 failure mode nodes
│   ├── tradeoffs.ts     16 tradeoff overlays
│   ├── projects.ts      10 project ideas
│   ├── learningPaths.ts 9 learning paths
│   ├── edges.ts         cross-domain edges (parent edges auto-derived)
│   └── index.ts         aggregator; this is what the renderer consumes
│
├── three/
│   ├── Scene.tsx        Canvas + lights + bloom
│   ├── layout.ts        Fibonacci-sphere galactic layout
│   ├── GalaxyGraph.tsx  nodes + edges + 3D labels
│   ├── NodeMesh.tsx     instanced spheres with halos
│   ├── EdgeCurves.tsx   bundled Bezier line segments
│   ├── Starfield.tsx    background stars
│   └── CameraRig.tsx    OrbitControls + lerp-to-target
│
├── ui/
│   ├── TopBar.tsx       logo, search, mode chips
│   ├── LeftPanel.tsx    filters, mode-specific lists, legend
│   ├── RightPanel.tsx   selected-node detail (all 15 content fields)
│   ├── ModeOverlay.tsx  Tradeoff / Project / Path overlay panels
│   ├── Minimap.tsx      2D projection with click-pick
│   ├── SearchBox.tsx    Fuse.js fuzzy search
│   └── KeyboardHints.tsx
│
└── lib/
    ├── search.ts        Fuse index builder
    ├── breadcrumbs.ts   walks parentId chain
    └── modes.ts         mode → emphasized-node-set selector
```

---

## How the data model works

Everything is a `GNode`. A node has:

- `id` — stable string
- `kind` — `domain | subdomain | concept | pattern | tool | metric | failureMode`
- `domainId` — which root domain it belongs to (drives color, via `domains.ts`)
- `parentId` — hierarchical parent (a subdomain's parent is its domain; a concept's parent is its subdomain)
- `level: 0 | 1 | 2 | 3` — galactic placement tier
- `difficulty` and `layer` — filter dimensions
- The content fields described above

**Edges** are typed: `parent` (auto-derived from `parentId`), `related`, `depends-on`, `implements`, `tradeoff-of`, `fails-as`. Parent edges and `related` edges are derived from node properties at build time; the rest live in `data/edges.ts`.

**Overlay entities** (`LearningPath`, `ProjectIdea`, `Tradeoff`) reference node ids. They don't add nodes — they re-emphasize subsets of the existing graph.

---

## How to add a new node

1. Open the right `src/data/nodes/<domain>.ts` (or the relevant scaffold inside `scaffolds.ts`).
2. Append using the helper:

```ts
conceptNode(
  'msg-tombstone',
  'Tombstone records',
  'messaging',           // domainId
  'msg-retention',       // parentId
  'Marker records that signal a key was deleted in a compacted log.',
  {
    whyItMatters: 'Required for downstream consumers to actually observe deletes.',
    failureModes: ['Long-lived tombstones bloat compaction.'],
    tags: ['kafka', 'compaction'],
  }
)
```

3. (Optional) add cross-domain edges in `src/data/edges.ts`:

```ts
e('msg-tombstone', 'db-cdc', 'related'),
```

4. (Optional) reference it from a `learningPaths.ts`, `projects.ts`, or `tradeoffs.ts` entry.

The renderer picks up the new node on next save; the Fibonacci layout adjusts automatically.

---

## How to add a new mode / overlay

Modes are filters over the same graph. To add e.g. a "Security Mode":

1. Add `'security'` to the `Mode` union in `src/data/schema.ts`.
2. Add it to the mode list in `src/ui/TopBar.tsx`.
3. Handle it in `src/lib/modes.ts` `emphasizedIds(...)` to return the set of node ids to emphasize.
4. (Optional) render a custom overlay panel in `src/ui/ModeOverlay.tsx` or a dedicated list in `src/ui/LeftPanel.tsx`.

---

## How the 3D layout works

`src/three/layout.ts` is the only place geometry decisions live.

1. The 26 domains are placed on a **Fibonacci sphere** of radius `R_DOMAIN = 90`. This guarantees roughly uniform angular spacing — no clusters and no overlaps.
2. For each domain, a local frame is built (up = direction from origin to the domain). Subdomains are placed on a **tilted ring** in that local frame.
3. Concepts are placed on a **small Fibonacci sphere** around their subdomain.
4. Level-3 detail nodes get a tighter sphere around their concept.

Edge curves are quadratic Beziers whose control point is pulled toward the galactic center — this produces the "constellation" look without a physics simulation.

All meshes are **instanced** (`InstancedMesh`), so the whole scene is two draw calls + one for edges + the starfield + the labels. Performance scales to thousands of nodes.

---

## Suggestions to improve further

- **Streaming search results into the 3D view** — fade non-matching nodes during typing.
- **Edge-weighted layout adjustment** — pull strongly-related nodes slightly closer (still deterministic so positions are stable).
- **Domain compass** — a tiny rotating compass at the corner showing which domain cluster the camera is facing.
- **URL-driven state** — share a deep link to a node, mode, or selected path.
- **Annotations layer** — let the user pin notes on nodes; persist to localStorage.
- **Reverse-lookup mode**: pick a tool → highlight every node that uses it.
- **Time slider** — for fields like "drift over time" or "tool adoption history".
- **Personal progress tracking** — mark concepts as "studied"; visualize coverage.
- **Plugin pack for SREs / data eng / LLM eng** — pre-bundled filter presets.

---

## Notes

- Single-file `.jsx` was the original ask. Multi-file Vite was chosen instead because at ~30 files of meaningful content, navigation matters more than the literal constraint. The structure mirrors what a real product would look like.
- Several non-flagship domains are scaffolded with subdomains and a few key concepts; their schemas are identical, and you extend them by following the recipe above.
- The data is **opinionated, not exhaustive**. Use it as a skeleton — add the concepts that matter to your stack.
