// store/index.js

import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { isAutoValidateInErrorState } from '../lib/validatePipeline';

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
  setAutoValidator: (fn) => {
    _autoValidateFn = fn;
  },
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },
  addNode: (node) => {
    set({ nodes: [...get().nodes, node] });
  },
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
