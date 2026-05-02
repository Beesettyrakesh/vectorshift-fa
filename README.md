# VectorShift — Frontend Technical Assessment

A **visual pipeline builder** where you drag nodes onto a canvas, wire them
together using handles or variable references, and validate the graph against
a FastAPI backend. Built with **React 18 + ReactFlow + Chakra UI** on the
frontend and **FastAPI** on the backend.

---

## Quick Start — Two Terminals

### Terminal 1 — Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# → Listening on http://localhost:8000
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm start
# → Opens http://localhost:3000
```

> **Prerequisites:** Node.js ≥ 18, Python ≥ 3.9

---

## What is this app?

This is a **node-based pipeline editor** — the same kind of visual
programming tool used in AI workflow builders (like n8n, LangFlow,
VectorShift). You compose pipelines by:

1. **Dragging nodes** from the left toolbar onto the canvas
2. **Wiring handles** between nodes (click-drag from a right-side source
   handle to a left-side target handle)
3. **Referencing other nodes' outputs** by typing `{{nodeName.varName}}`
   inside any text field — an edge appears automatically
4. **Running the pipeline** with the **Run** button to validate the graph

---

## Demo Walkthrough — Try It in 5 Minutes

### 1. Basic pipeline

1. Open `http://localhost:3000` (make sure the backend is running)
2. From the toolbar, drag an **Input** node, an **LLM** node, and an
   **Output** node onto the canvas
3. Connect `Input → LLM` by dragging from Input's right handle to LLM's
   left handle
4. Connect `LLM → Output` the same way
5. Click **Run** → a modal appears: `Nodes: 3, Edges: 2, Is DAG: Yes`

### 2. Variable references (auto-edges)

1. Rename the Input node to `myInput` (edit the Name field in the node)
2. In the LLM node's **Prompt** field, type `{{` — a picker popup appears
3. Select `myInput` from the node list, then `text` from the variable list
4. `{{myInput.text}}` is inserted as a chip — a **dashed edge** appears on
   the canvas automatically
5. The status chip in the toolbar updates to **✓ Valid DAG** within 300ms

### 3. Cycle detection

1. Add a **Transform** node
2. In the LLM Prompt field, reference `{{transform_1.output}}`
3. In the Transform node's **Input** field, reference `{{llm_1.response}}`
4. The status chip changes to **⚠ Cycle Detected** immediately
5. The two nodes and the edges between them turn **red** on the canvas
6. Click **Run** → modal confirms `Is DAG: No`

### 4. Text node with variable handles

1. Drag a **Text** node onto the canvas
2. Type `Hello {{input_1.text}}, today is {{date_node.value}}`
3. Two dynamic **input handles** appear on the left side of the Text node,
   one per unique reference

### 5. Filter node

1. Drag a **Filter** node
2. Set **List** to `{{input_1.text}}`, **Function** to `Contains`, and
   **Value** to `hello`
3. Connect the `passed` output to a downstream node

---

## Features

### Variable Namespace System

- Every node has a **Name** field (e.g. `llm_1`, `my_input`). This is the
  namespace for its output variables.
- Type `{{` in any field to open a **two-stage picker**:
  - Stage 1: list of all other nodes on the canvas
  - Stage 2: list of that node's output variables with type badges
- Selected references render as **inline chips** (purple = valid,
  red = invalid/stale)
- Renaming a node **cascades** all `{{oldName.var}}` references across the
  entire canvas automatically

### Auto-Edges

- When you insert a valid `{{node.var}}` chip, a **dashed gray edge**
  appears connecting the source node to the current node — no manual wiring
  needed
- If a real wired edge already exists for that pair, the auto-edge is
  deduplicated (no double line)
- Auto-edges are included in cycle detection (same as real edges)
- Removing a chip removes its auto-edge instantly

### Cycle Detection (live)

- Every time you add/remove a variable reference or connect/disconnect a
  handle, a debounced POST to `/pipelines/parse` runs automatically
- Cycle nodes get a **red border + red shadow**; cycle edges turn **red and
  animated**
- The **status badge** in the toolbar shows: `Idle` / `Validating…` /
  `✓ Valid DAG` / `⚠ Cycle Detected` / `✕ Backend Error`
- The **Run** button is disabled when the canvas is empty or no edges exist

### Outputs Panel

Every node exposes a collapsible **Outputs panel** (right side) listing its
output variables with type badges and connection handles. The panel is the
canonical source of what downstream nodes can reference.

---

## Node Catalogue

| Node | Accent | Inputs | Output Variables | Notes |
|------|--------|--------|-----------------|-------|
| **Input** | Green | — | `text` (Text mode) or `filename`, `processed_text`, `list` (File mode) | Type-dependent outputs |
| **Output** | Green | `value` | — | Sink node |
| **LLM** | Purple | `system`, `prompt` | `response`, `tokens_used`, `input_tokens`, `output_tokens`, `credits_used` | Model selector: GPT-4o, Claude 3.5, Gemini 1.5, etc. |
| **Text** | Cyan | Dynamic (one per `{{node.var}}` reference) | `result` (Text) | Auto-resizes; variable picker via `{{` |
| **Filter** | Orange | `input` | `passed` (List), `count` (Integer) | Function selector (19 options); Value hidden for is true/false/empty |
| **Transform** | Orange | `input` | `output` (Any), `error` (Text) | 15 transform types; Expression field shown for Custom Expression |
| **API Call** | Blue | `url`, `body` | `response` (Text), `status` (Integer), `error` (Text) | Body hidden for GET/DELETE; URL supports `{{var}}` chips |
| **Delay** | Amber | `input` | `output` (Any) | Delay in ms with NumberInput |
| **Conditional** | Red | `input` | `true_path` (Path), `false_path` (Path) | 15 operators in 4 groups; Value hidden for is true/false/empty/not empty |

---

## Folder Structure

```
frontend_technical_assessment/
├── backend/
│   ├── main.py                  FastAPI app + Kahn's DAG algorithm
│   ├── requirements.txt         fastapi, uvicorn[standard]
│   └── .venv/                   (gitignored)
└── frontend/
    └── src/
        ├── App.js               Root layout
        ├── index.js             ChakraProvider + ReactFlowProvider
        ├── components/
        │   ├── canvas/
        │   │   └── Canvas.js    ReactFlow drop canvas + edge styling
        │   ├── controls/
        │   │   ├── RunButton.js        Toolbar Run button + result modal
        │   │   ├── ValidationStatus.js Live DAG status badge
        │   │   ├── VariableTagInput.js Rich chip input with picker
        │   │   ├── VariableTextInput.js Single-line variable input
        │   │   ├── VariableTextarea.js  Multi-line variable input
        │   │   └── VariablePickerPopover.js Two-stage node/var picker
        │   ├── layout/
        │   │   ├── Toolbar.js    Draggable node palette
        │   │   └── DraggableNode.js Drag source chip
        │   └── nodes/
        │       ├── BaseNode.js   Shared node shell (all 9 types use this)
        │       ├── OutputsPanel.js Outputs panel sub-component
        │       ├── registry.js   Single source of truth for nodeTypes
        │       ├── Input.js / Output.js / LLM.js / Text.js
        │       ├── Filter.js / Transform.js / ApiCall.js
        │       ├── Delay.js / Conditional.js
        ├── lib/
        │   ├── variableNamespace.js  buildNamespace, validateRef, cascadeRename
        │   └── validatePipeline.js   POST /pipelines/parse, auto-validate, status
        ├── store/
        │   └── index.js         Zustand store (nodes, edges, autoEdges, actions)
        ├── styles/
        │   └── index.css        Minimal ReactFlow handle/edge overrides
        └── theme/
            └── index.js         Chakra UI theme tokens
```

---

## API Reference

### `POST /pipelines/parse`

**Request body:**

```json
{
  "nodes": [
    { "id": "input-1", "type": "customInput", "data": {} }
  ],
  "edges": [
    { "source": "input-1", "target": "llm-1" }
  ]
}
```

**Response (200):**

```json
{
  "num_nodes": 2,
  "num_edges": 1,
  "is_dag": true,
  "cycle_nodes": [],
  "cycle_edges": []
}
```

`cycle_nodes` and `cycle_edges` are populated when `is_dag` is `false`;
the frontend uses them to render the red cycle highlight.

**Errors:** `422` for malformed payloads (Pydantic validation).

### `GET /`

Liveness probe → `{ "Ping": "Pong" }`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, ReactFlow 11, Chakra UI v2, Zustand, react-icons |
| Backend | FastAPI, Uvicorn, Pydantic |
| Language | JavaScript (JSDoc typedefs), Python 3.9+ |
| Styling | Chakra UI theme tokens + minimal ReactFlow CSS overrides |

---

## Known Limitations

- **No persistence** — refreshing the browser clears the canvas
- **Local only** — CORS is allowlisted to `http://localhost:3000`
- **No unit/property tests** in this delivery (a test plan exists in
  `.kiro/specs/` for a follow-up iteration)
