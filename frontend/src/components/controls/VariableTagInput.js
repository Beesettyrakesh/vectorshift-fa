// components/controls/VariableTagInput.js
//
// Rich variable-aware input that renders {{node.var}} references as inline
// removable/editable chips while keeping the rest of the text editable.
//
// Chip interactions:
//   - Click chip label → opens picker to REPLACE that variable
//   - Click × button  → removes the chip entirely
//   - Type '{{' in textarea → opens picker to INSERT a new variable
//   - Click '+' button → same as '{{' trigger
//
// Validation:
//   - Each chip is validated live against the current namespace.
//   - Invalid chips (e.g. ref to a deleted node, or a var that no longer exists
//     because the source node's type changed) render in red with an error message
//     below the field: "Select a compatible output field for nodeName.varName"

import { useRef, useState, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Tag,
  TagLabel,
  TagCloseButton,
  TagLeftIcon,
  Icon,
  IconButton,
  Textarea,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiLink, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { VariablePickerPopover } from './VariablePickerPopover';
import { buildNamespace, validateRef } from '../../lib/variableNamespace';
import { useStore } from '../../store/index';

// ── Tokenizer ──────────────────────────────────────────────────────────────
const REF_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

function tokenize(value) {
  const tokens = [];
  let lastIndex = 0;
  let match;
  REF_PATTERN.lastIndex = 0;
  while ((match = REF_PATTERN.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: 'text', text: value.slice(lastIndex, match.index) });
    }
    tokens.push({ kind: 'ref', raw: match[0], nodeName: match[1], varName: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < value.length) {
    tokens.push({ kind: 'text', text: value.slice(lastIndex) });
  }
  return tokens;
}

/**
 * @param {string}   nodeId
 * @param {string}   fieldKey
 * @param {string}   value
 * @param {Function} onChange   (newValue: string) => void
 * @param {string}   [placeholder]
 * @param {number}   [minRows]
 */
export const VariableTagInput = ({
  nodeId,
  fieldKey,
  value,
  onChange,
  placeholder,
  minRows = 3,
}) => {
  const textareaRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replacingRaw, setReplacingRaw] = useState(null);

  // Live namespace for validation
  const nodes = useStore((s) => s.nodes);
  const namespace = useMemo(() => buildNamespace(nodes), [nodes]);

  const tokens = useMemo(() => tokenize(value ?? ''), [value]);

  const lastRefIndex = useMemo(() => {
    let idx = -1;
    tokens.forEach((t, i) => { if (t.kind === 'ref') idx = i; });
    return idx;
  }, [tokens]);

  const frozenRaw = useMemo(() => {
    if (lastRefIndex === -1) return '';
    let raw = '';
    for (let i = 0; i <= lastRefIndex; i++) {
      raw += tokens[i].kind === 'ref' ? tokens[i].raw : tokens[i].text;
    }
    return raw;
  }, [tokens, lastRefIndex]);

  const editableTail = useMemo(() => {
    if (lastRefIndex === -1) return value ?? '';
    let tail = '';
    for (let i = lastRefIndex + 1; i < tokens.length; i++) {
      tail += tokens[i].kind === 'ref' ? tokens[i].raw : tokens[i].text;
    }
    return tail;
  }, [tokens, lastRefIndex, value]);

  // Collect invalid refs for error messages
  const invalidRefs = useMemo(() =>
    tokens
      .filter((t) => t.kind === 'ref' && !validateRef(namespace, t.nodeName, t.varName))
      .map((t) => `${t.nodeName}.${t.varName}`),
    [tokens, namespace]
  );

  // ── Remove chip ──────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (rawToRemove) => { onChange((value ?? '').replace(rawToRemove, '')); },
    [value, onChange]
  );

  // ── Click chip label → replace mode ──────────────────────────────────────
  const handleChipClick = useCallback((raw) => {
    setReplacingRaw(raw);
    setPickerOpen(true);
  }, []);

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false);
    setReplacingRaw(null);
  }, []);

  // ── Insert / replace from picker ──────────────────────────────────────────
  const handleInsert = useCallback(
    (text) => {
      if (replacingRaw) {
        onChange((value ?? '').replace(replacingRaw, text));
      } else {
        const el = textareaRef.current;
        const tail = editableTail;
        const start = el ? el.selectionStart : tail.length;
        const end   = el ? el.selectionEnd   : start;
        const before = tail.slice(0, start).replace(/\{\{$/, '');
        const after  = tail.slice(end);
        onChange(frozenRaw + before + text + after);
        const pos = before.length + text.length;
        requestAnimationFrame(() => {
          if (el) { el.focus(); el.setSelectionRange(pos, pos); }
        });
      }
      setReplacingRaw(null);
    },
    [replacingRaw, value, frozenRaw, editableTail, onChange]
  );

  // ── Tail textarea change ───────────────────────────────────────────────────
  const handleTailChange = useCallback(
    (e) => {
      const newTail = e.target.value;
      onChange(frozenRaw + newTail);
      if (newTail.endsWith('{{')) {
        setReplacingRaw(null);
        setPickerOpen(true);
      }
    },
    [frozenRaw, onChange]
  );

  const frozenTokens = lastRefIndex >= 0 ? tokens.slice(0, lastRefIndex + 1) : [];
  const hasErrors = invalidRefs.length > 0;

  return (
    <VariablePickerPopover
      isOpen={pickerOpen}
      onClose={handlePickerClose}
      nodeId={nodeId}
      onInsert={handleInsert}
    >
      <VStack spacing={1} align="stretch">
        {/* Input box */}
        <Box
          position="relative"
          border="1px solid"
          borderColor={hasErrors ? 'red.400' : 'gray.200'}
          borderRadius="md"
          bg="white"
          _hover={{ borderColor: hasErrors ? 'red.500' : 'gray.300' }}
          _focusWithin={{
            borderColor: hasErrors ? 'red.500' : 'brand.500',
            boxShadow: hasErrors ? '0 0 0 1px #fc8181' : '0 0 0 1px #6366f1',
          }}
          p={2}
          pr="28px"
          minH={`${minRows * 24 + 16}px`}
          cursor="text"
          onClick={() => textareaRef.current?.focus()}
        >
          {/* Chips row */}
          {frozenTokens.length > 0 && (
            <Flex wrap="wrap" gap={1} mb={1} align="center">
              {frozenTokens.map((token, i) => {
                if (token.kind !== 'ref') {
                  return token.text ? (
                    <Box key={i} as="span" fontSize="sm" fontFamily="mono" color="gray.700" whiteSpace="pre-wrap">
                      {token.text}
                    </Box>
                  ) : null;
                }
                const isValid = validateRef(namespace, token.nodeName, token.varName);
                return (
                  <Tag
                    key={i}
                    size="sm"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={isValid ? 'purple.200' : 'red.300'}
                    bg={isValid ? 'purple.50' : 'red.50'}
                    userSelect="none"
                  >
                    <TagLeftIcon
                      as={isValid ? FiLink : FiAlertCircle}
                      boxSize="10px"
                      color={isValid ? 'purple.500' : 'red.500'}
                    />
                    <TagLabel
                      fontSize="11px"
                      fontFamily="mono"
                      fontWeight="600"
                      color={isValid ? 'purple.700' : 'red.600'}
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                      onClick={(e) => { e.stopPropagation(); handleChipClick(token.raw); }}
                      title={isValid ? 'Click to change variable' : 'Invalid reference — click to fix'}
                    >
                      {token.nodeName}.{token.varName}
                    </TagLabel>
                    <TagCloseButton
                      onClick={(e) => { e.stopPropagation(); handleRemove(token.raw); }}
                    />
                  </Tag>
                );
              })}
            </Flex>
          )}

          {/* Editable tail */}
          <Textarea
            ref={textareaRef}
            value={editableTail}
            onChange={handleTailChange}
            placeholder={frozenTokens.length === 0 ? placeholder : undefined}
            size="sm"
            variant="unstyled"
            resize="none"
            p={0}
            m={0}
            minH="24px"
            fontFamily="mono"
            fontSize="sm"
            bg="transparent"
            _focus={{ outline: 'none', boxShadow: 'none' }}
            rows={frozenTokens.length > 0 ? 2 : minRows}
            w="100%"
          />

          {/* + button */}
          <IconButton
            aria-label="Insert variable"
            icon={<Icon as={FiPlus} />}
            size="xs"
            variant="ghost"
            colorScheme="gray"
            position="absolute"
            top="4px"
            right="4px"
            onClick={(e) => {
              e.stopPropagation();
              setReplacingRaw(null);
              setPickerOpen(true);
            }}
            title="Insert {{variable}}"
          />
        </Box>

        {/* Error messages — one per invalid ref */}
        {invalidRefs.map((ref) => (
          <Text key={ref} fontSize="10px" color="red.500" display="flex" alignItems="center" gap="4px">
            <Icon as={FiAlertCircle} boxSize="10px" />
            Select a compatible output field for <Box as="span" fontFamily="mono" fontWeight="600">{ref}</Box>
          </Text>
        ))}
      </VStack>
    </VariablePickerPopover>
  );
};
