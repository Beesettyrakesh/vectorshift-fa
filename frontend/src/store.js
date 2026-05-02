// store.js

import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';
import { isAutoValidateInErrorState } from './validatePipeline';

// Helper used by setCycleHighlight so consumers can pass either `Set`s or
// arrays ("source>target" strings). Always stores `Set` instances internally
// for O(1) membership checks during render.
const toSet = (v) => (v instanceof Set ? v : new Set(v ?? []));

// ---------------------------------------------------------------------------
// Auto-validate debounce (Req 8.9, 8.10)
//
// onConnect, onNodesChange (with type:'remove'), and onEdgesChange (with
// type:'remove') all call `scheduleAutoValidate()` instead of POSTing
// directly. A module-scoped timer coalesces rapid-fire events (e.g. bulk
// delete, drag-to-connect) into a single request.
//
// The debounced function is stashed here rather than on the store so React
// re-renders of the store don't trigger re-allocation. It's wired up via
// setAutoValidate() on app start (see index.js).
// ---------------------------------------------------------------------------
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
    // Cycle highlight state (Req 8.6, 8.7, 8.8).
    // Populated by submit.js / auto-validate after POST /pipelines/parse.
    // `cycleEdgeKeys` stores "source>target" strings for fast lookup.
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
    // Wired up once on app start by validatePipeline.js; accepts the actual
    // "POST /pipelines/parse + write cycle highlight" function so the store
    // doesn't have to import from a layer it belongs under.
    setAutoValidator: (fn) => {
      _autoValidateFn = fn;
    },
    getNodeID: (type) => {
        const newIDs = {...get().nodeIDs};
        if (newIDs[type] === undefined) {
            newIDs[type] = 0;
        }
        newIDs[type] += 1;
        set({nodeIDs: newIDs});
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({
            nodes: [...get().nodes, node]
        });
    },
    onNodesChange: (changes) => {
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
      // Req 8.10: re-validate when a node is deleted (position/select
      // changes don't affect the DAG, so we filter).
      // Exception: if the last attempt failed (backend unreachable), we
      // use ANY interaction as a recovery signal — otherwise the user
      // would be stuck in "error" state until they happen to delete/connect.
      const hasRemove = changes.some((c) => c.type === 'remove');
      if (hasRemove || isAutoValidateInErrorState()) _scheduleAutoValidate();
    },
    onEdgesChange: (changes) => {
      set({
        edges: applyEdgeChanges(changes, get().edges),
      });
      // Req 8.10 (+ error-recovery escape hatch, see onNodesChange).
      const hasRemove = changes.some((c) => c.type === 'remove');
      if (hasRemove || isAutoValidateInErrorState()) _scheduleAutoValidate();
    },
    onConnect: (connection) => {
      set({
        edges: addEdge({...connection, type: 'smoothstep', animated: true, markerEnd: {type: MarkerType.Arrow, height: '20px', width: '20px'}}, get().edges),
      });
      // Req 8.9: re-validate when a new edge is created.
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
    // Remove edges attached to `nodeId` via a handle id that no longer exists.
    // ReactFlow only auto-prunes edges when a whole node is deleted; nodes
    // with dynamic handles (TextNode) must prune explicitly when their
    // handle set changes, or stale edges re-attach when a new handle appears.
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
