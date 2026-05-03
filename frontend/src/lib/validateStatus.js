// lib/validateStatus.js — isolated module for auto-validate status state.
// Extracted from validatePipeline.js to break the circular dependency:
//   store/index.js → validatePipeline.js → store/index.js
//
// Both store/index.js and validatePipeline.js can safely import from here
// because this file has no imports of its own.

let _status = 'idle';
const _listeners = new Set();

export const getAutoValidateStatus = () => _status;
export const isAutoValidateInErrorState = () => _status === 'error';
export const subscribeAutoValidateStatus = (cb) => {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
};
export const _setStatus = (next) => {
  if (_status === next) return;
  _status = next;
  for (const cb of _listeners) cb(_status);
};
