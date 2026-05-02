// components/controls/VariableTextarea.js
//
// Shared multi-line variable-aware textarea component (Phase 2, Task 22).
// Full implementation will be added in Task 22 (two-stage {{ picker).
// This stub exports the named export so imports don't break during
// the incremental build-out.

import { Textarea } from '@chakra-ui/react';

/**
 * Variable-aware multi-line textarea.
 * Phase 2 stub — autocomplete picker will be added in Task 22.
 *
 * @param {Object} props
 * @param {string}   props.nodeId     id of the owning node (to exclude self)
 * @param {string}   props.fieldKey   e.g. "prompt" — used for auto-edge handle id
 * @param {string}   props.value      controlled value
 * @param {Function} props.onChange   (newValue: string) => void
 * @param {string}   [props.placeholder]
 */
export const VariableTextarea = ({ nodeId, fieldKey, value, onChange, placeholder, ...rest }) => (
  <Textarea
    size="sm"
    bg="white"
    borderColor="gray.200"
    _hover={{ borderColor: 'gray.300' }}
    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
    rows={3}
    resize="vertical"
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
);
