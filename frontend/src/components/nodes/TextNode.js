import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Box, Textarea } from '@chakra-ui/react';
import { useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../../store/index';
import { getNodeOutputs } from '../../lib/variableNamespace';

// ── Sizing constants ──────────────────────────────────────────────────────────
const MIN_W = 240;    // px
const MAX_W = 500;    // px
const MIN_H = 80;     // px
const PADDING_X = 96; // left+right node padding for width calculation

// Matches {{variable}} — a valid JS identifier in double curly braces.
// Each unique variable name becomes one left-side input Handle on the Text node.
// Users type these manually as template placeholders (e.g. {{name}}, {{context}}).
// This is intentionally different from the {{node.var}} dot-notation used by
// VariableTagInput — Text node variables are reusable slot names, not namespace refs.
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/** @type {import('./BaseNode').BaseNodeConfig} */
const textNodeConfig = {
  title: 'Text',
  icon: FiFileText,
  accentColor: '#06b6d4',
  inputs: [],    // dynamic — derived from {{variable}} detection
  outputs: [],   // handled via outputVars → OutputsPanel
  fields: [],
};

const TEXT_OUTPUT_VARS = getNodeOutputs('text');

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const pruneStaleEdgesForNode = useStore((s) => s.pruneStaleEdgesForNode);
  const updateNodeInternals = useUpdateNodeInternals();
  const text = data?.text ?? '';

  const mirrorRef = useRef(null);    // hidden span for width measurement
  const containerRef = useRef(null); // real container for height measurement
  const [nodeW, setNodeW] = useState(MIN_W);

  // ── Detect {{variable}} references → dynamic input handles ───────────────
  // Each unique variable name becomes one left-side target Handle.
  // No picker, no chips, no namespace validation — user types freely.
  const variableNames = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    VARIABLE_PATTERN.lastIndex = 0;
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const name = match[1];
      if (!seen.has(name)) { seen.add(name); ordered.push(name); }
    }
    return ordered;
  }, [text]);

  // Stable string key for memoising dynamicInputs without a deep comparison
  const variableKey = variableNames.join('\u0000');
  const dynamicInputs = useMemo(
    () => variableNames.map((name) => ({ name, label: name })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variableKey]
  );

  // Prune stale edges + notify ReactFlow when variable handles change
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

  // ── Auto-resize width: measure longest line via hidden mirror span ────────
  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) return;
    const lines = text.split('\n');
    const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
    mirror.textContent = longestLine || ' ';
    const contentW = Math.ceil(mirror.scrollWidth) + PADDING_X;
    const nextW = Math.min(Math.max(contentW, MIN_W), MAX_W);
    if (nextW !== nodeW) {
      setNodeW(nextW);
      updateNodeInternals(id);
    }
  }, [text, id, nodeW, updateNodeInternals]);

  // ── Auto-resize height: ResizeObserver on the textarea container ─────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0 && h >= MIN_H) updateNodeInternals(id);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [id, updateNodeInternals]);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={textNodeConfig}
      dynamicInputs={dynamicInputs}
      outputVars={TEXT_OUTPUT_VARS}
      outputHandleCount={1}
      containerProps={{ w: `${nodeW}px`, minW: `${MIN_W}px` }}
    >
      <Box ref={containerRef}>
        <Textarea
          value={text}
          onChange={(e) => updateNodeField(id, 'text', e.target.value)}
          placeholder="Enter text… type {{variable}} to create an input handle"
          size="sm"
          bg="white"
          borderColor="gray.200"
          fontFamily="mono"
          fontSize="sm"
          resize="vertical"
          minH={`${MIN_H}px`}
          rows={3}
          _hover={{ borderColor: 'gray.300' }}
          _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
        />
      </Box>
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
