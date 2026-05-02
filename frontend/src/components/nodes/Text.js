import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Box, Textarea } from '@chakra-ui/react';
import { useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../../store/index';

const MIN_W = 200;
const MAX_W = 500;
const MIN_H = 80;
const PADDING_X = 80;
const PADDING_Y = 4;
const DEFAULT_TEXT = '{{input}}';
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

const MIRROR_STYLES = {
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 400,
  letterSpacing: '0',
  lineHeight: '1.4',
  whiteSpace: 'pre',
};

/** @type {import('./BaseNode').BaseNodeConfig} */
const textNodeConfig = {
  title: 'Text',
  icon: FiFileText,
  accentColor: '#06b6d4',
  inputs: [],
  outputs: [{ name: 'output' }],
  fields: [],
};

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const pruneStaleEdgesForNode = useStore((s) => s.pruneStaleEdgesForNode);
  const updateNodeInternals = useUpdateNodeInternals();
  const text = data?.text !== undefined ? data.text : DEFAULT_TEXT;

  const mirrorRef = useRef(null);
  const textareaRef = useRef(null);
  const [dims, setDims] = useState({ w: MIN_W, h: MIN_H });

  const variableNames = useMemo(() => {
    const seen = new Set();
    const ordered = [];
    for (const match of text.matchAll(VARIABLE_PATTERN)) {
      const name = match[1];
      if (!seen.has(name)) {
        seen.add(name);
        ordered.push(name);
      }
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
      `${id}-output`,
      ...variableNames.map((name) => `${id}-${name}`),
    ]);
    pruneStaleEdgesForNode(id, validHandleIds);
    updateNodeInternals(id);
  }, [variableKey, variableNames, id, updateNodeInternals, pruneStaleEdgesForNode]);

  useLayoutEffect(() => {
    const mirror = mirrorRef.current;
    const textarea = textareaRef.current;
    if (!mirror || !textarea) return;

    mirror.textContent = text.length > 0 ? text : ' ';
    const nextW = Math.min(
      Math.max(Math.ceil(mirror.scrollWidth) + PADDING_X, MIN_W),
      MAX_W
    );

    textarea.style.height = 'auto';
    const nextH = Math.max(textarea.scrollHeight + PADDING_Y, MIN_H);

    if (nextW !== dims.w || nextH !== dims.h) {
      setDims({ w: nextW, h: nextH });
      updateNodeInternals(id);
    }
  }, [text, id, dims.w, dims.h, updateNodeInternals]);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={textNodeConfig}
      dynamicInputs={dynamicInputs}
      containerProps={{ w: `${dims.w}px`, minW: `${MIN_W}px` }}
    >
      <Textarea
        ref={textareaRef}
        size="sm"
        resize="none"
        value={text}
        onChange={(e) => updateNodeField(id, 'text', e.target.value)}
        placeholder="Enter text..."
        h={`${dims.h}px`}
        minH={`${MIN_H}px`}
        spellCheck={false}
        bg="white"
        borderColor="gray.200"
        _hover={{ borderColor: 'gray.300' }}
        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
      />
      <Box
        ref={mirrorRef}
        position="absolute"
        top="-9999px"
        left="-9999px"
        visibility="hidden"
        aria-hidden="true"
        pointerEvents="none"
        sx={MIRROR_STYLES}
      />
    </BaseNode>
  );
};
