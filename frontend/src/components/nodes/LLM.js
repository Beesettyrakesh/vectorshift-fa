import { FiCpu } from 'react-icons/fi';
import { Text } from '@chakra-ui/react';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const llmNodeConfig = {
  title: 'LLM',
  icon: FiCpu,
  accentColor: '#a855f7',
  inputs: [{ name: 'system' }, { name: 'prompt' }],
  outputs: [{ name: 'response' }],
  fields: [],
};

export const LLMNode = ({ id, data, selected }) => (
  <BaseNode id={id} data={data} selected={selected} config={llmNodeConfig}>
    <Text fontSize="sm" color="node.textMuted">
      This is a LLM.
    </Text>
  </BaseNode>
);
