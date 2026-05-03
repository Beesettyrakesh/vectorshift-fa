import { useLayoutEffect, useMemo, useRef, useState, useEffect } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Box } from '@chakra-ui/react';
import { useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from './BaseNode';
import { VariableTagInput } from '../controls/VariableTagInput';
import { useStore } from '../../store/index';
import { getNodeOutputs } from '../../lib/variableNamespace';

// ── Sizing constants ──────────────────────────────────────────────────────────
const MIN_W = 240;   // px — matches other nodes' default width
const MAX_W = 500;   // px — max width before text wraps and only height grows
const MIN_H = 80;    // px — minimum textarea height
const LINE_H = 21;   // approx px per line (used for width-only estimate)
const PADDING_X = 96; // left+right node padding for width calculation

// Matches {{variable}} — simple JS identifier in double curly braces.
// This is the Text node's own variable syntax: each unique variable name
// becomes a left-side input Handle that other nodes can connect into.
// This is intentionally different from the dot-notation {{node.var}} used
// by VariableTagInput chips — Text node variables are local placeholders,
// not references to specific output variables of upstream nodes.
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

/** @type {import('./BaseNode').BaseNodeConfig} */
const textNodeConfig = {
  title: 'Text',
  icon: FiFileText,
  accentColor: '#06b6d4',
  inputs: [],    // dynamic inputs from {{node.var}} detection
  outputs: [],   // handled via outputVars → OutputsPanel
  fields: [],
};

const TEXT_OUTPUT_VARS = getNodeOutputs('text');

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const pruneStaleEdgesForNode = useStore((s) => s.pruneStaleEdgesForNode);
  const updateNodeInternals = useUpdateNodeInternals();
  // Default to empty string — no pre-filled placeholder value
  const text = data?.text ?? '';

  const mirrorRef = useRef(null);       // hidden span for width measurement
  const containerRef = useRef(null);    // real container for height measurement
  const [nodeW, setNodeW] = useState(MIN_W);
  const [textareaH, setTextareaH] = useState(MIN_H);

  // ── Detect {{variable}} references → dynamic input handles ───────────────
  // Each unique variable name becomes one left-side target Handle.
  const variableNames = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    VARIABLE_PATTERN.lastIndex = 0;
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const name = match[1]; // e.g. "input", "myVar"
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

  // ── Auto-resize height: ResizeObserver on actual container ───────────────
  // LINE_H * lineCount under-estimates height when there are chip rows.
  // ResizeObserver reads the real rendered clientHeight — always accurate.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) {
        const nextH = Math.max(h, MIN_H);
        setTextareaH((prev) => {
          if (Math.abs(prev - nextH) < 2) return prev; // avoid jitter
          updateNodeInternals(id);
          return nextH;
        });
      }
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
        <VariableTagInput
          nodeId={id}
          fieldKey="text"
          value={text}
          onChange={(val) => updateNodeField(id, 'text', val)}
          placeholder="Enter text or type {{ to add variables…"
          minRows={3}
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
