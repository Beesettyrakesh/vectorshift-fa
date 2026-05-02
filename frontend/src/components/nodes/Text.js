import { useLayoutEffect, useMemo, useRef, useState } from 'react';
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
const CHAR_W = 8.4;  // approx px per character at 14px monospace
const LINE_H = 21;   // approx px per line
const PADDING_X = 96; // left+right padding inside the node (px 4 = 16px each side + extras)
const PADDING_Y = 8;

// Matches {{node.var}} dot-notation references (same as VariableTagInput)
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

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

  const mirrorRef = useRef(null);    // hidden span for width measurement
  const [nodeW, setNodeW] = useState(MIN_W);
  const [textareaH, setTextareaH] = useState(MIN_H);

  // ── Detect {{node.var}} references → dynamic input handles ────────────────
  const variableNames = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    VARIABLE_PATTERN.lastIndex = 0;
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      // Use "nodeName__varName" as a unique handle key
      const key = `${match[1]}__${match[2]}`;
      if (!seen.has(key)) { seen.add(key); ordered.push({ node: match[1], var: match[2] }); }
    }
    return ordered;
  }, [text]);

  const variableKey = variableNames.map((v) => `${v.node}.${v.var}`).join('\u0000');
  const dynamicInputs = useMemo(
    () => variableNames.map((v) => ({ name: `${v.node}__${v.var}`, label: `${v.node}.${v.var}` })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variableKey]
  );

  const prevVariableKey = useRef('');
  useLayoutEffect(() => {
    if (prevVariableKey.current === variableKey) return;
    prevVariableKey.current = variableKey;
    const validHandleIds = new Set([
      `${id}-result`,
      ...variableNames.map((v) => `${id}-${v.node}__${v.var}`),
    ]);
    pruneStaleEdgesForNode(id, validHandleIds);
    updateNodeInternals(id);
  }, [variableKey, variableNames, id, updateNodeInternals, pruneStaleEdgesForNode]);

  // ── Auto-resize: grow width with longest line, grow height with content ───
  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    if (!mirror) return;

    // Width: measure longest line (strip chip markup, use raw text length)
    const lines = text.split('\n');
    const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b), '');
    mirror.textContent = longestLine || ' ';
    const contentW = Math.ceil(mirror.scrollWidth) + PADDING_X;
    const nextW = Math.min(Math.max(contentW, MIN_W), MAX_W);

    // Height: estimate from line count
    const lineCount = Math.max(lines.length, 1);
    const nextH = Math.max(lineCount * LINE_H + PADDING_Y, MIN_H);

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
      outputHandleCount={1}
      containerProps={{ w: `${nodeW}px`, minW: `${MIN_W}px` }}
    >
      <VariableTagInput
        nodeId={id}
        fieldKey="text"
        value={text}
        onChange={(val) => updateNodeField(id, 'text', val)}
        placeholder="Enter text or type {{ to add variables…"
        minRows={3}
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
