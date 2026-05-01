// nodes/llmNode.js
//
// LLM node — represents a large-language-model invocation with two inputs
// (System prompt, User prompt) and one output (Response). After the Task
// 3.3 migration this is a thin wrapper that declares a BaseNodeConfig and
// defers all rendering to `<BaseNode />`.
//
// Preserved invariants vs. the pre-migration implementation:
//   - Node type key:  llm                (unchanged in nodeRegistry)
//   - Handle ids:     `${id}-system`, `${id}-prompt`, `${id}-response`
//                     (existing edges still resolve unchanged)
//   - Body content:   "This is a LLM." descriptor line
//
// First node to exercise BaseNode's `children` escape hatch — when a node
// has no form fields (config.fields is empty) but still wants custom body
// content, pass that content as children and BaseNode renders it inside
// the body box instead of auto-generating form fields.

import { FiCpu } from 'react-icons/fi';
import { Text } from '@chakra-ui/react';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const llmNodeConfig = {
  title: 'LLM',
  icon: FiCpu,
  accentColor: '#a855f7', // nodeAccent.ai (purple)
  inputs: [
    { name: 'system' },
    { name: 'prompt' },
  ],
  outputs: [{ name: 'response' }],
  fields: [],
};

export const LLMNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={llmNodeConfig}
  >
    <Text fontSize="sm" color="node.textMuted">
      This is a LLM.
    </Text>
  </BaseNode>
);
