// Conditional node — routes flow down a true or false path based on a condition.
//
// UX purpose:
//   - Input: the value to test (e.g. {{llm_1.response}})
//   - Operator: how to test it (equals, contains, is true, is empty…)
//   - Value: what to compare against — hidden for self-contained operators
//     (is true, is false, is empty, is not empty)
//
// Outputs: `true_path` (if condition passes) + `false_path` (if it fails).
// Both outputs have right-side connection handles (outputHandleCount=2).

import { FiGitBranch } from 'react-icons/fi';
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
const conditionalNodeConfig = {
  title: 'Conditional',
  icon: FiGitBranch,
  accentColor: '#ef4444',
  inputs: [{ name: 'input' }],
  outputs: [],
  fields: [],
};

const CONDITIONAL_OUTPUT_VARS = [
  { varName: 'true_path',  type: 'Path', description: 'Taken when condition is true'  },
  { varName: 'false_path', type: 'Path', description: 'Taken when condition is false' },
];

// Operators that do NOT need a Value field
const NO_VALUE_OPS = new Set(['is_true', 'is_false', 'is_empty', 'is_not_empty']);

const OPERATOR_OPTIONS = [
  // ── Equality ──
  { label: '── Equality ──',      value: '',            disabled: true },
  { label: 'Equals',              value: 'equals'          },
  { label: 'Not Equals',          value: 'not_equals'      },
  // ── String ──
  { label: '── String ──',        value: '',            disabled: true },
  { label: 'Contains',            value: 'contains'        },
  { label: 'Not Contains',        value: 'not_contains'    },
  { label: 'Starts With',         value: 'starts_with'     },
  { label: 'Ends With',           value: 'ends_with'       },
  // ── Numeric ──
  { label: '── Numeric ──',       value: '',            disabled: true },
  { label: 'Greater Than',        value: 'gt'              },
  { label: 'Less Than',           value: 'lt'              },
  { label: 'Greater or Equal',    value: 'gte'             },
  { label: 'Less or Equal',       value: 'lte'             },
  // ── Boolean / Presence ──
  { label: '── Boolean / Null ──', value: '',           disabled: true },
  { label: 'Is True',             value: 'is_true'         },
  { label: 'Is False',            value: 'is_false'        },
  { label: 'Is Empty',            value: 'is_empty'        },
  { label: 'Is Not Empty',        value: 'is_not_empty'    },
];

export const ConditionalNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const input    = data?.input    ?? '';
  const operator = data?.operator ?? 'equals';
  const value    = data?.value    ?? '';

  const showValue = !NO_VALUE_OPS.has(operator);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={conditionalNodeConfig}
      outputVars={CONDITIONAL_OUTPUT_VARS}
      outputHandleCount={2}
      containerProps={{ minW: '280px' }}
    >
      <VStack spacing={2} align="stretch">
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

        {/* Operator */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Operator
          </FormLabel>
          <Select
            size="sm"
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            value={operator}
            onChange={(e) => updateNodeField(id, 'operator', e.target.value)}
          >
            {OPERATOR_OPTIONS.map((opt, i) =>
              opt.disabled ? (
                <option key={`group-${opt.label}`} value="" disabled style={{ color: '#999', fontStyle: 'italic' }}>
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

        {/* Value — hidden for is true / is false / is empty / is not empty */}
        {showValue && (
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
              Value
            </FormLabel>
            <VariableTagInput
              nodeId={id}
              fieldKey="value"
              value={value}
              onChange={(val) => updateNodeField(id, 'value', val)}
              placeholder="Value or {{var}}…"
              minRows={1}
            />
          </FormControl>
        )}
      </VStack>
    </BaseNode>
  );
};
