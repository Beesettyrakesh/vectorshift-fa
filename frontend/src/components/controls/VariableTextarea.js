// components/controls/VariableTextarea.js
//
// Variable-aware multi-line textarea.
// Same picker behavior as VariableTextInput but uses <Textarea> as the base.

import { useRef, useState, useCallback } from 'react';
import { Box, Flex, Textarea, Icon, IconButton } from '@chakra-ui/react';
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
export const VariableTextarea = ({ nodeId, fieldKey, value, onChange, placeholder, ...rest }) => {
  const textareaRef = useRef(null);
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
      const el = textareaRef.current;
      if (!el) { onChange((value ?? '') + text); return; }

      const start = el.selectionStart ?? (value ?? '').length;
      const end = el.selectionEnd ?? start;
      const current = value ?? '';

      // Remove trailing '{{' before inserting the full reference
      const before = current.slice(0, start).replace(/\{\{$/, '');
      const after = current.slice(end);
      const next = before + text + after;
      onChange(next);

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
      {/* Wrapper is the PopoverTrigger child */}
      <Box position="relative" w="100%">
        <Textarea
          ref={textareaRef}
          size="sm"
          bg="white"
          borderColor={hasInvalidRef ? 'red.400' : 'gray.200'}
          _hover={{ borderColor: hasInvalidRef ? 'red.500' : 'gray.300' }}
          _focus={{
            borderColor: hasInvalidRef ? 'red.500' : 'brand.500',
            boxShadow: hasInvalidRef ? '0 0 0 1px #fc8181' : '0 0 0 1px #6366f1',
          }}
          rows={3}
          resize="vertical"
          value={value ?? ''}
          placeholder={placeholder}
          onChange={handleChange}
          fontFamily="mono"
          fontSize="sm"
          pr="28px"   // room for the + button
          {...rest}
        />
        {/* + button — top-right corner */}
        <IconButton
          aria-label="Insert variable"
          icon={<Icon as={FiPlus} />}
          size="xs"
          variant="ghost"
          colorScheme="gray"
          position="absolute"
          top="4px"
          right="4px"
          onClick={() => setPickerOpen(true)}
          title="Insert {{variable}}"
        />
      </Box>
    </VariablePickerPopover>
  );
};
