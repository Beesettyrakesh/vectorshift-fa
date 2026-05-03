// lib/useNamespace.js
//
// Shared hook that computes the variable namespace once per render.
// Both VariableTagInput and VariablePickerPopover use this to avoid
// calling buildNamespace(nodes) independently in every field instance.
//
// Why this matters:
//   With 10 nodes × 3 fields = 30 VariableTagInput instances, each calling
//   buildNamespace(nodes) in its own useMemo. Every store update triggers
//   30 redundant namespace rebuilds. This hook centralises the computation
//   so it's easy to lift to a context/store selector in the future.

import { useMemo } from 'react';
import { useStore } from '../store/index';
import { buildNamespace } from './variableNamespace';

export const useNamespace = () => {
  const nodes = useStore((s) => s.nodes);
  return useMemo(() => buildNamespace(nodes), [nodes]);
};
