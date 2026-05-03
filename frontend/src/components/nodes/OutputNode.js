import { FiLogOut } from 'react-icons/fi';
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
const outputNodeConfig = {
  title: 'Output',
  icon: FiLogOut,
  accentColor: '#22c55e',
  inputs: [{ name: 'value' }],
  outputs: [],   // Output node intentionally has no Outputs panel
  fields: [],
};

const OUTPUT_TYPE_OPTIONS = [
  { label: 'Text', value: 'Text' },
  { label: 'File', value: 'File' },
];

export const OutputNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const outputType = data?.outputType ?? 'Text';
  const filename   = data?.filename   ?? '';

  const showFilename = outputType === 'File';

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={outputNodeConfig}
      containerProps={{ minW: '260px' }}
    >
      <VStack spacing={2} align="stretch">
        {/* Type */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Type
          </FormLabel>
          <Select
            size="sm"
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            value={outputType}
            onChange={(e) => updateNodeField(id, 'outputType', e.target.value)}
          >
            {OUTPUT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Filename — only shown when type is File */}
        {showFilename && (
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
              Filename
            </FormLabel>
            <VariableTagInput
              nodeId={id}
              fieldKey="filename"
              value={filename}
              onChange={(val) => updateNodeField(id, 'filename', val)}
              placeholder="output.txt or {{node.var}}…"
              minRows={1}
            />
          </FormControl>
        )}
      </VStack>
    </BaseNode>
  );
};
