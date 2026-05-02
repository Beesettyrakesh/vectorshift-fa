// components/controls/VariableTextInput.js
//
// Variable-aware single-line input.
// Typing '{{' OR clicking the '+' button opens the two-stage variable picker.
// Selecting a variable inserts '{{nodeName.varName}}' at the cursor position.
// Invalid references ({{foo.bar}} where foo or bar doesn't exist) show red styling.

import { useRef, useState, useCallback } from 'react';
import { Box, Flex, Input, Icon, IconButton } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { VariablePickerPopover } from './VariablePickerPopover';
import { buildNamespace, parseRefs, validateRef } from '../../lib/variableNamespace';
import { useStore } from '../../store/index';

/**
 * @param {string}   nodeId        Owning node id (to exclude self from namespace)
 * @param {string}   fieldKey      Field key for auto-edge handle id
 * @param {string}   value         Controlled value
 * @param {Function} onChange      (newValue: string) => void
 * @param {string}   [placeholder]
 */
export const VariableTextInput = ({ nodeId, fieldKey, value, onChange, placeholder, ...rest }) => {
  const inputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nodes = useStore((s) => s.nodes);

  // ── Validity check ───────────────────────────────────────────────────────
  const namespace = buildNamespace(nodes);
  const refs = parseRefs(value ?? '');
  const hasInvalidRef = refs.some((r) => !validateRef(namespace, r.nodeName, r.varName));

  // ── Trigger picker on {{ ─────────────────────────────────────────────────
  const handleChange = useCallback(
    (e) => {
      const newVal = e.target.value;
      onChange(newVal);
      if (newVal.endsWith('{{')) {
        setPickerOpen(true);
      }
    },
    [onChange]
  );

  // ── Insert at cursor ─────────────────────────────────────────────────────
  const handleInsert = useCallback(
    (text) => {
      const el = inputRef.current;
      if (!el) { onChange((value ?? '') + text); return; }

      const start = el.selectionStart ?? (value ?? '').length;
      const end = el.selectionEnd ?? start;
      const current = value ?? '';

      // If the text ends with '{{', remove it before inserting the full ref
      const before = current.slice(0, start).replace(/\{\{$/, '');
      const after = current.slice(end);
      const next = before + text + after;
      onChange(next);

      // Restore cursor position after React re-render
      const pos = before.length + text.length;
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    [value, onChange]
  );

  return (
    <VariablePickerPopover
      isOpen={pickerOpen}
      onClose={() => setPickerOpen(false)}
      nodeId={nodeId}
      onInsert={handleInsert}
    >
      {/* Flex wrapper is the PopoverTrigger child */}
      <Flex gap={1} align="center" w="100%">
        <Input
          ref={inputRef}
          size="sm"
          bg="white"
          borderColor={hasInvalidRef ? 'red.400' : 'gray.200'}
          _hover={{ borderColor: hasInvalidRef ? 'red.500' : 'gray.300' }}
          _focus={{
            borderColor: hasInvalidRef ? 'red.500' : 'brand.500',
            boxShadow: hasInvalidRef ? '0 0 0 1px #fc8181' : '0 0 0 1px #6366f1',
          }}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={handleChange}
          fontFamily="mono"
          fontSize="sm"
          flex="1"
          {...rest}
        />
        <IconButton
          aria-label="Insert variable"
          icon={<Icon as={FiPlus} />}
          size="xs"
          variant="ghost"
          colorScheme="gray"
          onClick={() => setPickerOpen(true)}
          flexShrink={0}
          title="Insert {{variable}}"
        />
      </Flex>
    </VariablePickerPopover>
  );
};
