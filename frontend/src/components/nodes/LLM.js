import { FiCpu } from 'react-icons/fi';
import { Text } from '@chakra-ui/react';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const llmNodeConfig = {
  title: 'LLM',
  icon: FiCpu,
  accentColor: '#a855f7',
  inputs: [{ name: 'prompt' }],
  outputs: [],
  fields: [],
};

// Show 5 info rows in the panel, but only 1 handle (response)
const LLM_OUTPUT_VARS = [
  { varName: 'response',      type: 'Text',    description: 'The LLM response'         },
  { varName: 'tokens_used',   type: 'Integer', description: 'Total tokens consumed'     },
  { varName: 'input_tokens',  type: 'Integer', description: 'Tokens in the prompt'      },
  { varName: 'output_tokens', type: 'Integer', description: 'Tokens in the response'    },
  { varName: 'credits_used',  type: 'Integer', description: 'API credits used'          },
];

export const LLMNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={llmNodeConfig}
    outputVars={LLM_OUTPUT_VARS}
    outputHandleCount={1}
  >
    <Text fontSize="sm" color="node.textMuted" mt={1}>
      This is a LLM.
    </Text>
  </BaseNode>
);
