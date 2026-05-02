// validatePipeline.js — shared POST /pipelines/parse helper used by both
// the manual Submit button (submit.js) and the debounced auto-validate
// hook triggered by the store's onConnect / onNodesChange / onEdgesChange.
//
// Also owns a tiny publish/subscribe for the footer status indicator
// (ValidationStatus.js) so we don't add more state to the Zustand store
// for transient UI chrome.

import { useStore } from './store';

export const PARSE_URL = 'http://localhost:8000/pipelines/parse';

/**
 * Serialize the current pipeline into the backend's expected shape.
 *   nodes → [{ id, type, data }]
 *   edges → [{ source, target }]  (sourceHandle / targetHandle stripped)
 */
export const buildPayload = (nodes, edges) => ({
  nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
  edges: edges.map((e) => ({ source: e.source, target: e.target })),
});

/**
 * POST the pipeline and return the parsed response or throw.
 *
 * Success shape (from backend ParseResponse):
 *   { num_nodes, num_edges, is_dag, cycle_nodes, cycle_edges }
 *
 * Always writes cycle highlights into the store as a side-effect so the
 * canvas updates regardless of caller.
 *
 * @returns {Promise<ParseResponse>}
 * @throws  {Error} on network / HTTP error
 */
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

/**
 * Push the cycle_nodes / cycle_edges from a ParseResponse into the store.
 * Empty arrays clear any prior highlight (satisfies Req 8.8).
 */
export const applyCycleHighlightFromResponse = (response) => {
  const setCycleHighlight = useStore.getState().setCycleHighlight;
  const nodeIds = new Set(response.cycle_nodes ?? []);
  const edgeKeys = new Set(
    (response.cycle_edges ?? []).map((e) => `${e.source}>${e.target}`),
  );
  setCycleHighlight(nodeIds, edgeKeys);
};

/** Imperatively clear any cycle highlighting (used on error / reset). */
export const clearCycleHighlight = () => {
  useStore.getState().clearCycleHighlight();
};

// ---------------------------------------------------------------------------
// Auto-validate status bus (for the footer ValidationStatus component).
//
// States:
//   'idle'        no pipeline yet / nothing to show
//   'validating'  request in flight
//   'dag'         last response: is_dag=true
//   'cycle'       last response: is_dag=false
//   'error'       last attempt failed (network / HTTP)
// ---------------------------------------------------------------------------
let _status = 'idle';
const _listeners = new Set();

export const getAutoValidateStatus = () => _status;
/** True if the last auto-validate attempt failed (network / HTTP). Used by
 *  the store to relax its change-filter so ANY interaction re-triggers a
 *  POST while the backend is down — otherwise recovery would require a
 *  connect/delete, which may never happen. */
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

/**
 * The function the store calls (via setAutoValidator) after debounce fires.
 * Reads the latest nodes/edges straight from the store so we never send
 * stale data.
 *
 * Suppresses errors silently — auto-validate is background work, not a
 * user-initiated action. Failures surface the next time the user clicks
 * Submit.
 */
const _runAutoValidate = async () => {
  const state = useStore.getState();
  // Empty canvas is trivially a DAG; skip the request.
  if (state.nodes.length === 0 && state.edges.length === 0) {
    clearCycleHighlight();
    _setStatus('idle');
    return;
  }
  _setStatus('validating');
  try {
    const data = await validatePipeline(state.nodes, state.edges);
    _setStatus(data.is_dag ? 'dag' : 'cycle');
  } catch (e) {
    _setStatus('error');
  }
};

/**
 * Wire the store's scheduleAutoValidate to our runner. Safe to call
 * multiple times (idempotent: re-sets the same function).
 */
export const registerAutoValidator = () => {
  useStore.getState().setAutoValidator(_runAutoValidate);
};
