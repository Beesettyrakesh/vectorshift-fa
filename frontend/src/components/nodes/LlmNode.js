import { FiCpu } from 'react-icons/fi';
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { BaseNode } from './BaseNode';
import { VariableTagInput } from '../controls/VariableTagInput';
import { useStore } from '../../store/index';

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
  { varName: 'credits_used',  type: 'Decimal', description: 'API credits used'          },
];

const MODEL_OPTIONS = [
  { label: 'GPT-4o',            value: 'gpt-4o'              },
  { label: 'GPT-4o mini',       value: 'gpt-4o-mini'         },
  { label: 'GPT-4 Turbo',       value: 'gpt-4-turbo'         },
  { label: 'GPT-3.5 Turbo',     value: 'gpt-3.5-turbo'       },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet'   },
  { label: 'Claude 3 Haiku',    value: 'claude-3-haiku'      },
];

const DEFAULT_MODEL = 'gpt-4o';

export const LlmNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const model        = data?.model        ?? DEFAULT_MODEL;
  const systemPrompt = data?.systemPrompt ?? '';
  const prompt       = data?.prompt       ?? '';

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={llmNodeConfig}
      outputVars={LLM_OUTPUT_VARS}
      outputHandleCount={1}
      containerProps={{ minW: '320px' }}
    >
      <VStack spacing={2} align="stretch">
        {/* Model */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Model
          </FormLabel>
          <Select
            size="sm"
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            value={model}
            onChange={(e) => updateNodeField(id, 'model', e.target.value)}
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* System Prompt */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            System Prompt
          </FormLabel>
          <VariableTagInput
            nodeId={id}
            fieldKey="systemPrompt"
            value={systemPrompt}
            onChange={(val) => updateNodeField(id, 'systemPrompt', val)}
            placeholder="You are a helpful assistant..."
            minRows={2}
          />
        </FormControl>

        {/* Prompt */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Prompt
          </FormLabel>
          <VariableTagInput
            nodeId={id}
            fieldKey="prompt"
            value={prompt}
            onChange={(val) => updateNodeField(id, 'prompt', val)}
            placeholder="Type your prompt or {{ to insert a variable..."
            minRows={3}
          />
        </FormControl>
      </VStack>
    </BaseNode>
  );
};
