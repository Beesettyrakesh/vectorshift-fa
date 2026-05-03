// lib/validatePipeline.js — shared POST /pipelines/parse helper used by both
// the manual Run button and the debounced auto-validate hook triggered by the
// store's onConnect / onNodesChange / onEdgesChange.

import { useStore } from '../store/index';

export const PARSE_URL = 'http://localhost:8000/pipelines/parse';

// Deduplicate edges by source→target pair so a manual edge + auto-edge
// between the same two nodes are counted as one.
export const dedupeEdges = (edges) => {
  const seen = new Set();
  return edges.filter((e) => {
    const key = `${e.source}>${e.target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const buildPayload = (nodes, edges) => ({
  nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
  edges: edges.map((e) => ({ source: e.source, target: e.target })),
});

export const validatePipeline = async (nodes, edges, { signal } = {}) => {
  const res = await fetch(PARSE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPayload(nodes, edges)),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}`);
  }

  const data = await res.json();
  applyCycleHighlightFromResponse(data);
  return data;
};

export const applyCycleHighlightFromResponse = (response) => {
  const setCycleHighlight = useStore.getState().setCycleHighlight;
  const nodeIds = new Set(response.cycle_nodes ?? []);
  const edgeKeys = new Set(
    (response.cycle_edges ?? []).map((e) => `${e.source}>${e.target}`)
  );
  setCycleHighlight(nodeIds, edgeKeys);
};

export const clearCycleHighlight = () => {
  useStore.getState().clearCycleHighlight();
};

let _status = 'idle';
const _listeners = new Set();

export const getAutoValidateStatus = () => _status;
export const isAutoValidateInErrorState = () => _status === 'error';
export const subscribeAutoValidateStatus = (cb) => {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
};
const _setStatus = (next) => {
  if (_status === next) return;
  _status = next;
  for (const cb of _listeners) cb(_status);
};

const _runAutoValidate = async () => {
  const state = useStore.getState();
  // Merge autoEdges so cycle detection sees variable-reference dependencies too.
  // Deduplicate so a manual A→B + auto-edge A→B count as one edge.
  const allEdges = dedupeEdges([...state.edges, ...(state.autoEdges ?? [])]);
  // Idle when canvas is empty OR nodes exist but nothing is connected yet
  if (state.nodes.length === 0 || allEdges.length === 0) {
    clearCycleHighlight();
    _setStatus('idle');
    return null;
  }
  _setStatus('validating');
  try {
    const data = await validatePipeline(state.nodes, allEdges);
    _setStatus(data.is_dag ? 'dag' : 'cycle');
    // Return the parsed response so callers (e.g. RunButton) can use
    // the backend's authoritative num_nodes/num_edges counts directly
    // instead of counting client-side (which can double-count auto-edges).
    return data;
  } catch (e) {
    _setStatus('error');
    return null;
  }
};

// Export so RunButton can reuse it (keeps status chip in sync)
export const runAutoValidate = _runAutoValidate;

export const registerAutoValidator = () => {
  useStore.getState().setAutoValidator(_runAutoValidate);
};
