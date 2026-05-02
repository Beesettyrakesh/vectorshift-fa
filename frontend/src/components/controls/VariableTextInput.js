// components/controls/VariableTextInput.js
//
// Shared single-line variable-aware input component (Phase 2, Task 22).
// Full implementation will be added in Task 22 (two-stage {{ picker).
// This stub exports the named export so imports don't break during
// the incremental build-out.

import { Input } from '@chakra-ui/react';

/**
 * Variable-aware single-line text input.
 * Phase 2 stub — autocomplete picker will be added in Task 22.
 *
 * @param {Object} props
 * @param {string}   props.nodeId     id of the owning node (to exclude self)
 * @param {string}   props.fieldKey   e.g. "url" — used for auto-edge handle id
 * @param {string}   props.value      controlled value
 * @param {Function} props.onChange   (newValue: string) => void
 * @param {string}   [props.placeholder]
 */
export const VariableTextInput = ({ nodeId, fieldKey, value, onChange, placeholder, ...rest }) => (
  <Input
    size="sm"
    bg="white"
    borderColor="gray.200"
    _hover={{ borderColor: 'gray.300' }}
    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    {...rest}
  />
);
