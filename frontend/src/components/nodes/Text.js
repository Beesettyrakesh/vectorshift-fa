import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Box, Textarea } from '@chakra-ui/react';
import { useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../../store/index';
import { getNodeOutputs } from '../../lib/variableNamespace';

// ── Sizing constants ──────────────────────────────────────────────────────────
const MIN_W = 240;   // px — matches other nodes' default width
const MAX_W = 500;   // px — max width before text wraps and only height grows
const MIN_H = 80;    // px — minimum textarea height
const CHAR_W = 8.4;  // approx px per character at 14px monospace
const LINE_H = 21;   // approx px per line
const PADDING_X = 96; // left+right padding inside the node (px 4 = 16px each side + extras)
const PADDING_Y = 8;

const DEFAULT_TEXT = '{{input}}';
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

/** @type {import('./BaseNode').BaseNodeConfig} */
const textNodeConfig = {
  title: 'Text',
  icon: FiFileText,
  accentColor: '#06b6d4',
  inputs: [],    // dynamic inputs from {{var}} detection
  outputs: [],   // handled via outputVars → OutputsPanel
  fields: [],
};

const TEXT_OUTPUT_VARS = getNodeOutputs('text');

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const pruneStaleEdgesForNode = useStore((s) => s.pruneStaleEdgesForNode);
  const updateNodeInternals = useUpdateNodeInternals();
  const text = data?.text !== undefined ? data.text : DEFAULT_TEXT;

  const mirrorRef = useRef(null);    // hidden span for width measurement
  const textareaRef = useRef(null);
  const [nodeW, setNodeW] = useState(MIN_W);
  const [textareaH, setTextareaH] = useState(MIN_H);

  // ── Detect {{variable}} references → dynamic input handles ────────────────
  const variableNames = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const name = match[1];
      if (!seen.has(name)) { seen.add(name); ordered.push(name); }
    }
    return ordered;
  }, [text]);

  const variableKey = variableNames.join('\u0000');
  const dynamicInputs = useMemo(
    () => variableNames.map((name) => ({ name, label: name })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variableKey]
  );

  const prevVariableKey = useRef('');
  useLayoutEffect(() => {
    if (prevVariableKey.current === variableKey) return;
    prevVariableKey.current = variableKey;
    const validHandleIds = new Set([
      `${id}-result`,
      ...variableNames.map((name) => `${id}-${name}`),
    ]);
    pruneStaleEdgesForNode(id, validHandleIds);
    updateNodeInternals(id);
  }, [variableKey, variableNames, id, updateNodeInternals, pruneStaleEdgesForNode]);

  // ── Auto-resize: grow width with longest line, grow height with content ───
  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    const textarea = textareaRef.current;
    if (!mirror || !textarea) return;

    // Width: measure longest line
    const lines = text.split('\n');
    const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
    mirror.textContent = longestLine || ' ';
    const contentW = Math.ceil(mirror.scrollWidth) + PADDING_X;
    const nextW = Math.min(Math.max(contentW, MIN_W), MAX_W);

    // Height: if text would wrap (width capped), measure scrollHeight
    textarea.style.height = 'auto';
    const nextH = Math.max(textarea.scrollHeight + PADDING_Y, MIN_H);

    let changed = false;
    if (nextW !== nodeW) { setNodeW(nextW); changed = true; }
    if (nextH !== textareaH) { setTextareaH(nextH); changed = true; }
    if (changed) updateNodeInternals(id);
  }, [text, id, nodeW, textareaH, updateNodeInternals]);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={textNodeConfig}
      dynamicInputs={dynamicInputs}
      outputVars={TEXT_OUTPUT_VARS}
      containerProps={{ w: `${nodeW}px`, minW: `${MIN_W}px` }}
    >
      <Textarea
        ref={textareaRef}
        size="sm"
        resize="none"
        value={text}
        onChange={(e) => updateNodeField(id, 'text', e.target.value)}
        placeholder="Enter text or type {{ to add variables..."
        h={`${textareaH}px`}
        minH={`${MIN_H}px`}
        spellCheck={false}
        bg="white"
        borderColor="gray.200"
        _hover={{ borderColor: 'gray.300' }}
        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
        w="100%"
        fontFamily="mono"
        fontSize="sm"
      />
      {/* Hidden mirror span for width measurement */}
      <Box
        ref={mirrorRef}
        as="span"
        position="absolute"
        top="-9999px"
        left="-9999px"
        visibility="hidden"
        aria-hidden="true"
        pointerEvents="none"
        fontFamily="mono"
        fontSize="sm"
        whiteSpace="pre"
        display="inline-block"
      />
    </BaseNode>
  );
};
