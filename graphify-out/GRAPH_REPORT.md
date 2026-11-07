Token accounting: host-agent usage is unavailable; any zero token fields below are placeholders, not measured usage.

# Graph Report - agent skill site  (2026-11-03)

## Corpus Check
- Corpus is ~6,423 words - fits in a single context window. You may not need a graph.

## Summary
- 81 nodes · 107 edges · 14 communities (9 shown, 5 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 3 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Workflow: 
- Workflow: ADDENDUM-metallic-reference.txt
- Workflow: prepare-delivery.mjs
- Workflow: plan-products.mjs
- Workflow: 
- Workflow: export-lossless.mjs
- Workflow: AGENTS.md
- Workflow: AGENTS.md
- Workflow: CONTENT_RULES.txt
- Workflow: SKILL.md
- Workflow: SKILL.md
- Workflow: SKILL.md
- Workflow: CONTENT_RULES.txt
- Workflow: README.md

## God Nodes (most connected - your core abstractions)
1. `Agent workflow instructions` - 10 edges
2. `Matilda content production rules` - 8 edges
3. `Matilda product images execution skill` - 8 edges
4. `Metallic appearance reference user override` - 7 edges
5. `Lighting and polish user override` - 6 edges
6. `write_json()` - 4 edges
7. `read_json()` - 3 edges
8. `prepare()` - 3 edges
9. `build()` - 3 edges
10. `Category Word prompts via PROMPT/categories.json` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Append complete lighting-polish addendum after category prompt` --references--> `Lighting and polish user override`  [EXTRACTED]
  SKILL.md → PROMPT/ADDENDUM-lighting-polish.txt
- `Verify dimensions and decoded pixel equality` --semantically_similar_to--> `Separate visual acceptance and technical compliance`  [INFERRED] [semantically similar]
  CONTENT_RULES.txt → AGENTS.md
- `Agent workflow instructions` --references--> `Matilda content production rules`  [EXTRACTED]
  AGENTS.md → CONTENT_RULES.txt
- `Agent workflow instructions` --references--> `Matilda product images execution skill`  [EXTRACTED]
  AGENTS.md → SKILL.md
- `Matilda content production rules` --conceptually_related_to--> `Separate requested model from verified tool settings`  [EXTRACTED]
  CONTENT_RULES.txt → AGENTS.md

## Import Cycles
- None detected.

## Communities (14 total, 5 thin omitted)

### Community 0 - "Workflow: "
Cohesion: 0.26
Nodes (4): build(), prepare(), read_json(), write_json()

### Community 1 - "Workflow: ADDENDUM-metallic-reference.txt"
Cohesion: 0.29
Nodes (8): Lighting and polish user override, Bright controlled gold illumination, D4AF57 representative gold midtone anchor, Remove superficial scratches on visible yellow gold, Crown-heart Necklace/178777 comparison sample, Directional highlights and localized dark reflections, Metallic appearance reference user override, material-reference.png guides material response only

### Community 2 - "Workflow: prepare-delivery.mjs"
Cohesion: 0.18
Nodes (10): destination, height, input, pipeline, relative, report, resolvedRelative, root (+2 more)

### Community 3 - "Workflow: plan-products.mjs"
Cohesion: 0.25
Nodes (4): categories, promptMap, report, root

### Community 5 - "Workflow: export-lossless.mjs"
Cohesion: 0.33
Nodes (4): input, relative, report, root

### Community 6 - "Workflow: AGENTS.md"
Cohesion: 0.40
Nodes (4): Agent workflow instructions, Bounded Graphify lookup for file relationships, Project-local token optimizer workflow, Independent built-in image_gen request per product

### Community 7 - "Workflow: AGENTS.md"
Cohesion: 0.50
Nodes (3): Category Word prompts via PROMPT/categories.json, Dedicated Word prompt replaces archival generic prompt, Read complete dedicated Word text and tables

### Community 9 - "Workflow: SKILL.md"
Cohesion: 0.50
Nodes (4): Matilda product images execution skill, scripts/export-lossless.mjs creates lossless WebP, Append complete lighting-polish addendum after category prompt, Decoded PNG and WebP pixel equality verification

### Community 11 - "Workflow: SKILL.md"
Cohesion: 0.67
Nodes (3): Plan products before every batch, ready delivered_skip export_only and review states, out put/workflow-state.json records input fingerprints

## Knowledge Gaps
- **6 isolated node(s):** `Bounded Graphify lookup for file relationships`, `Project-local token optimizer workflow`, `Crown-heart Necklace/178777 comparison sample`, `HAMED project README`, `out put/workflow-state.json records input fingerprints` (+1 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 36 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Matilda product images execution skill` connect `Workflow: SKILL.md` to `Workflow: AGENTS.md`, `Workflow: AGENTS.md`, `Workflow: CONTENT_RULES.txt`, `Workflow: SKILL.md`, `Workflow: SKILL.md`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `Bounded Graphify lookup for file relationships`, `Project-local token optimizer workflow`, `Crown-heart Necklace/178777 comparison sample` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `Append complete lighting-polish addendum after category prompt` connect `Workflow: SKILL.md` to `Workflow: ADDENDUM-metallic-reference.txt`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Lighting and polish user override` connect `Workflow: ADDENDUM-metallic-reference.txt` to `Workflow: SKILL.md`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._