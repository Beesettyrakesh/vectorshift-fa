# Frontend — VectorShift Pipeline Builder

React 18 + ReactFlow + Chakra UI workspace.

> **Full documentation** (features, demo walkthrough, API reference, node
> catalogue) is in the [project root README](../README.md).

---

## Setup

```bash
npm install       # install dependencies (one-time)
npm start         # dev server → http://localhost:3000
npm run build     # production build → ./build/
```

The frontend expects the FastAPI backend to be running on
`http://localhost:8000`. Start it first:

```bash
cd ../backend
source .venv/bin/activate
uvicorn main:app --reload
```

---

## Key Concepts

### Variable References

Any field that uses `VariableTagInput` (LLM prompts, Filter, Transform,
API Call, Conditional, Text) supports the `{{nodeName.varName}}` syntax:

- Type `{{` or click the `+` button → a picker opens
- **Stage 1** — pick a source node from the canvas
- **Stage 2** — pick one of that node's output variables
- The reference is inserted as a **chip**
- A **dashed gray edge** appears on the canvas automatically

### Node Names

Every node has a **Name** field at the top. The name is the namespace for
its outputs. Rename a node and all `{{oldName.var}}` references across the
canvas update automatically.

### Run Button

Located in the toolbar (top-right). Disabled when:
- No nodes on the canvas
- Nodes exist but no edges between them

Clicking **Run** posts the pipeline to the backend and shows a modal with
`num_nodes`, `num_edges`, and `Is DAG`.

### Status Badge

The toolbar also shows a live validation badge that updates within 300ms
after any connection or variable reference change:

| Badge | Meaning |
|-------|---------|
| `Idle` | Empty canvas or no edges |
| `Validating…` | POST in-flight |
| `✓ Valid DAG` | Acyclic graph |
| `⚠ Cycle Detected` | Cycle found — nodes/edges highlighted red |
| `✕ Backend Error` | Backend unreachable |

---

## Source Layout

```
src/
├── App.js                      Root layout (Toolbar + Canvas)
├── index.js                    ChakraProvider + ReactFlowProvider
├── components/
│   ├── canvas/Canvas.js        Drop canvas, edge merge + cycle styling
│   ├── controls/
│   │   ├── RunButton.js        Run button + result modal
│   │   ├── ValidationStatus.js Live status badge
│   │   ├── VariableTagInput.js Chip input with two-stage picker
│   │   ├── VariableTextInput.js Single-line variant
│   │   ├── VariableTextarea.js Multi-line variant
│   │   └── VariablePickerPopover.js Picker popover (stage 1 + 2)
│   ├── layout/
│   │   ├── Toolbar.js          Left palette
│   │   └── DraggableNode.js    Drag source chip
│   └── nodes/
│       ├── BaseNode.js         Shared shell used by all 9 node types
│       ├── OutputsPanel.js     Right-side outputs list + handles
│       ├── registry.js         nodeTypes map + toolbarEntries
│       ├── Input.js            Input node (Text / File)
│       ├── Output.js           Output node
│       ├── LLM.js              LLM node (model, system prompt, prompt)
│       ├── Text.js             Text node (auto-resize + dynamic handles)
│       ├── Filter.js           Filter node (list + function + expression)
│       ├── Transform.js        Transform node (15 types)
│       ├── ApiCall.js          API Call node (method + URL + body)
│       ├── Delay.js            Delay node (ms)
│       └── Conditional.js      Conditional node (15 operators)
├── lib/
│   ├── variableNamespace.js    buildNamespace, validateRef, cascadeRename
│   └── validatePipeline.js     fetch helper, auto-validate, status pub/sub
├── store/index.js              Zustand store
├── styles/index.css            ReactFlow handle + edge overrides
└── theme/index.js              Chakra UI design tokens
```

1. rename the "passed" output variable to "list"
2. Rename run to validate