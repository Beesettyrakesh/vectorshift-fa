// store/index.js

import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { isAutoValidateInErrorState } from '../lib/validatePipeline';
import { cascadeRename } from '../lib/variableNamespace';

const toSet = (v) => (v instanceof Set ? v : new Set(v ?? []));

const DEBOUNCE_MS = 300;
let _autoValidateTimer = null;
let _autoValidateFn = null;
const _scheduleAutoValidate = () => {
  if (!_autoValidateFn) return;
  if (_autoValidateTimer) clearTimeout(_autoValidateTimer);
  _autoValidateTimer = setTimeout(() => {
    _autoValidateTimer = null;
    const fn = _autoValidateFn;
    if (fn) fn();
  }, DEBOUNCE_MS);
};

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  nodeIDs: {},

  // ── auto-edges (visual only — never sent to backend) ─────────────────────
  autoEdges: [],
  setAutoEdges: (nodeId, fieldKey, refs) => {
    // refs = [{ sourceNodeName, sourceVarName }] for valid {{node.var}} chips
    // Build unique edge entries for this (nodeId, fieldKey) combo, then merge
    // with all auto-edges from OTHER fields/nodes.
    const prev = get().autoEdges.filter(
      (e) => !(e._nodeId === nodeId && e._fieldKey === fieldKey)
    );
    const nodes = get().nodes;
    // Resolve sourceNodeName → nodeId via nodeName
    const nameToId = {};
    nodes.forEach((n) => { if (n.data?.nodeName) nameToId[n.data.nodeName] = n.id; });

    const next = refs
      .map((r) => {
        const sourceId = nameToId[r.sourceNodeName];
        if (!sourceId || sourceId === nodeId) return null;
        return {
          id: `auto__${sourceId}__${r.sourceVarName}__${nodeId}__${fieldKey}`,
          source: sourceId,
          target: nodeId,
          sourceHandle: `${sourceId}-${r.sourceVarName}`,
          // No targetHandle — each auto-edge from a different source must use a
          // unique handle or no handle at all; sharing "${nodeId}-input" causes
          // ReactFlow to render only the first edge (silent dedup by handle key).
          type: 'smoothstep',
          _nodeId: nodeId,
          _fieldKey: fieldKey,
          // visual marker
          style: { stroke: '#94a3b8', strokeDasharray: '5 4', strokeWidth: 1.5, opacity: 0.7 },
          animated: false,
          selectable: false,
          deletable: false,
        };
      })
      .filter(Boolean);
    set({ autoEdges: [...prev, ...next] });
    // Auto-validate so cycle detection fires immediately when refs change
    _scheduleAutoValidate();
  },

  // ── cycle highlight ───────────────────────────────────────────────────────
  cycleNodeIds: new Set(),
  cycleEdgeKeys: new Set(),
  setCycleHighlight: (nodeIds, edgeKeys) => {
    set({
      cycleNodeIds: toSet(nodeIds),
      cycleEdgeKeys: toSet(edgeKeys),
    });
  },
  clearCycleHighlight: () => {
    set({ cycleNodeIds: new Set(), cycleEdgeKeys: new Set() });
  },

  // ── auto-validator ────────────────────────────────────────────────────────
  setAutoValidator: (fn) => {
    _autoValidateFn = fn;
  },

  // ── node id generation ────────────────────────────────────────────────────
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  // ── add node ──────────────────────────────────────────────────────────────
  addNode: (node) => {
    // Derive default nodeName from the node id: e.g. "customInput-1" → "input_1"
    const typeAliases = {
      customInput: 'input',
      customOutput: 'output',
      llm: 'llm',
      text: 'text',
      filter: 'filter',
      transform: 'transform',
      apiCall: 'api_call',
      delay: 'delay',
      conditional: 'conditional',
    };
    const alias = typeAliases[node.type] ?? node.type;
    const idSuffix = node.id.split('-').pop(); // last segment = counter
    const defaultName = `${alias}_${idSuffix}`;
    const enrichedNode = {
      ...node,
      data: {
        nodeName: defaultName,
        ...node.data,
      },
    };
    set({ nodes: [...get().nodes, enrichedNode] });
  },

  // ── rename node (cascade) ─────────────────────────────────────────────────
  renameNode: (nodeId, oldName, newName) => {
    // 1. Update the node's own nodeName
    // 2. Cascade all {{oldName.xxx}} → {{newName.xxx}} in other nodes
    const updated = cascadeRename(
      get().nodes.map((n) => {
        if (n.id !== nodeId) return n;
        return { ...n, data: { ...n.data, nodeName: newName } };
      }),
      oldName,
      newName
    );
    set({ nodes: updated });
  },

  // ── ReactFlow change handlers ─────────────────────────────────────────────
  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    const hasRemove = changes.some((c) => c.type === 'remove');
    if (hasRemove || isAutoValidateInErrorState()) _scheduleAutoValidate();
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    const hasRemove = changes.some((c) => c.type === 'remove');
    if (hasRemove || isAutoValidateInErrorState()) _scheduleAutoValidate();
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
        },
        get().edges
      ),
    });
    _scheduleAutoValidate();
  },

  // ── field updates ─────────────────────────────────────────────────────────
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, [fieldName]: fieldValue };
        }
        return node;
      }),
    });
  },

  pruneStaleEdgesForNode: (nodeId, validHandleIds) => {
    set({
      edges: get().edges.filter((e) => {
        if (e.source === nodeId && !validHandleIds.has(e.sourceHandle)) return false;
        if (e.target === nodeId && !validHandleIds.has(e.targetHandle)) return false;
        return true;
      }),
    });
  },
}));
