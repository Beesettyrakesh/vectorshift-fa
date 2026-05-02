// Transform node — applies a transformation to an input value.
//
// UX purpose:
//   - Pick a Transform Type (e.g. Uppercase, Parse JSON, Sort)
//   - Point the Input field at a variable (e.g. {{input_0.text}})
//   - For "Custom Expression", an Expression field appears for arbitrary logic
//
// Outputs: `output` (the transformed value) + `error` (any error message).
// Only `output` has a right-side connection handle.

import { FiRepeat } from 'react-icons/fi';
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
  Input,
} from '@chakra-ui/react';
import { BaseNode } from './BaseNode';
import { VariableTagInput } from '../controls/VariableTagInput';
import { useStore } from '../../store/index';

/** @type {import('./BaseNode').BaseNodeConfig} */
const transformNodeConfig = {
  title: 'Transform',
  icon: FiRepeat,
  accentColor: '#f97316',
  inputs: [{ name: 'input' }],
  outputs: [],
  fields: [],
};

const TRANSFORM_OUTPUT_VARS = [
  { varName: 'output', type: 'Any',  description: 'Transformed value'    },
  { varName: 'error',  type: 'Text', description: 'Error message if any' },
];

const TRANSFORM_OPTIONS = [
  // ── Text ──
  { label: '── Text ──',          value: '',                disabled: true },
  { label: 'Uppercase',           value: 'uppercase'           },
  { label: 'Lowercase',           value: 'lowercase'           },
  { label: 'Trim',                value: 'trim'                },
  { label: 'Replace',             value: 'replace'             },
  { label: 'Extract (Regex)',     value: 'extract'             },
  // ── Parsing ──
  { label: '── Parsing ──',       value: '',                disabled: true },
  { label: 'Parse JSON',          value: 'parse_json'          },
  { label: 'Stringify (to JSON)', value: 'stringify'           },
  { label: 'Split',               value: 'split'               },
  { label: 'Join',                value: 'join'                },
  // ── List ──
  { label: '── List ──',          value: '',                disabled: true },
  { label: 'Map',                 value: 'map'                 },
  { label: 'Slice',               value: 'slice'               },
  { label: 'Sort',                value: 'sort'                },
  { label: 'Reverse',             value: 'reverse'             },
  // ── Custom ──
  { label: '── Custom ──',        value: '',                disabled: true },
  { label: 'Custom Expression',   value: 'custom'              },
];

export const TransformNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const transformType = data?.transformType ?? 'uppercase';
  const input         = data?.input        ?? '';
  const expression    = data?.expression   ?? '';

  const showExpression = transformType === 'custom';

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={transformNodeConfig}
      outputVars={TRANSFORM_OUTPUT_VARS}
      outputHandleCount={1}
      containerProps={{ minW: '280px' }}
    >
      <VStack spacing={2} align="stretch">
        {/* Transform Type */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Transform Type
          </FormLabel>
          <Select
            size="sm"
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            value={transformType}
            onChange={(e) => updateNodeField(id, 'transformType', e.target.value)}
          >
            {TRANSFORM_OPTIONS.map((opt, i) =>
              opt.disabled ? (
                <option key={i} value="" disabled style={{ color: '#999', fontStyle: 'italic' }}>
                  {opt.label}
                </option>
              ) : (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              )
            )}
          </Select>
        </FormControl>

        {/* Input */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Input
          </FormLabel>
          <VariableTagInput
            nodeId={id}
            fieldKey="input"
            value={input}
            onChange={(val) => updateNodeField(id, 'input', val)}
            placeholder="Value or {{var}}…"
            minRows={1}
          />
        </FormControl>

        {/* Expression — only for Custom Expression */}
        {showExpression && (
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
              Expression
            </FormLabel>
            <Input
              size="sm"
              bg="white"
              borderColor="gray.200"
              fontFamily="mono"
              fontSize="xs"
              _hover={{ borderColor: 'gray.300' }}
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
              value={expression}
              onChange={(e) => updateNodeField(id, 'expression', e.target.value)}
              placeholder="e.g. x.trim().split(',')"
            />
          </FormControl>
        )}
      </VStack>
    </BaseNode>
  );
};
