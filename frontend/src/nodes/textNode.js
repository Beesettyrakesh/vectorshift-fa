// TextNode — auto-resizing text block. Width tracks the longest line of
// text up to a 500 px cap; height grows as text wraps. Uses a hidden
// mirror <Box> to measure natural width because `textarea.scrollWidth`
// only reports the visible (wrapped) width.
//
// See BaseNode.js for the card chrome; this file owns the sizing logic.
// Task 8.1 will populate `inputs` from {{ variable }} patterns in the text.

import { useLayoutEffect, useRef, useState } from 'react';
import { FiFileText } from 'react-icons/fi';
import { Box, Textarea } from '@chakra-ui/react';
import { useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from '../components/BaseNode';
import { useStore } from '../store';

const MIN_W = 200;
const MAX_W = 500;
const MIN_H = 80;

// Container width = mirror.scrollWidth + PADDING_X. Breakdown:
//   BaseNode body px={5}        : 40  (20 each side)
//   Textarea size="sm" px       : 24  (space.3 = 12 each side)
//   Border                      :  2
//   Safety (sub-pixel, kerning) : 14
const PADDING_X = 80;
const PADDING_Y = 4;

const DEFAULT_TEXT = '{{input}}';

// Mirror styles MUST match the Textarea or width measurements drift.
const MIRROR_STYLES = {
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 400,
  letterSpacing: '0',
  lineHeight: '1.4',
  whiteSpace: 'pre',
};

/** @type {import('../components/BaseNode').BaseNodeConfig} */
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
  const updateNodeInternals = useUpdateNodeInternals();
  const text = data?.text !== undefined ? data.text : DEFAULT_TEXT;

  const mirrorRef = useRef(null);
  const textareaRef = useRef(null);
  const [dims, setDims] = useState({ w: MIN_W, h: MIN_H });

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

    // Guard against no-op state updates → avoids an infinite measure loop.
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
