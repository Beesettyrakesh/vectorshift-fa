// Filter node — filters a list based on a condition applied to each item.
//
// UX purpose:
//   - "List" = the input list variable (e.g. {{input_0.list}})
//   - "Condition" = what to test on each item (e.g. "Contains", "Is Numeric")
//   - "Value" = what to compare against — hidden for self-contained checks like
//     "Is Numeric", "Is Empty", "Is True", "Is False"
//
// Outputs: `passed` = items that matched, `count` = how many matched.
// Only `passed` has a connection handle (outputHandleCount=1).

import { FiFilter } from 'react-icons/fi';
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
const filterNodeConfig = {
  title: 'Filter',
  icon: FiFilter,
  accentColor: '#f97316',
  inputs: [{ name: 'input' }],
  outputs: [],
  fields: [],
};

const FILTER_OUTPUT_VARS = [
  { varName: 'passed', type: 'List',    description: 'Items that matched'  },
  { varName: 'count',  type: 'Integer', description: 'Number of matches'   },
];

// Conditions that need a Value field
const NEEDS_VALUE = new Set([
  'contains', 'not_contains', 'starts_with', 'ends_with',
  'equals', 'not_equals', 'gt', 'lt', 'gte', 'lte',
  'regex', 'in_list', 'not_in_list',
]);

const CONDITION_OPTIONS = [
  // ── Type checks (no value needed) ──
  { label: '── Type checks ──',  value: '',          disabled: true },
  { label: 'Is Numeric',         value: 'is_numeric'    },
  { label: 'Is String',          value: 'is_string'     },
  { label: 'Is Boolean',         value: 'is_boolean'    },
  { label: 'Is Empty',           value: 'is_empty'      },
  { label: 'Is Not Empty',       value: 'is_not_empty'  },
  { label: 'Is True',            value: 'is_true'       },
  { label: 'Is False',           value: 'is_false'      },
  // ── Comparison (value needed) ──
  { label: '── Comparison ──',   value: '',          disabled: true },
  { label: 'Equals',             value: 'equals'        },
  { label: 'Not Equals',         value: 'not_equals'    },
  { label: 'Greater Than',       value: 'gt'            },
  { label: 'Less Than',          value: 'lt'            },
  { label: 'Greater or Equal',   value: 'gte'           },
  { label: 'Less or Equal',      value: 'lte'           },
  // ── String checks (value needed) ──
  { label: '── String checks ──', value: '',          disabled: true },
  { label: 'Contains',           value: 'contains'      },
  { label: 'Not Contains',       value: 'not_contains'  },
  { label: 'Starts With',        value: 'starts_with'   },
  { label: 'Ends With',          value: 'ends_with'     },
  { label: 'Regex Match',        value: 'regex'         },
  // ── List membership ──
  { label: '── Membership ──',   value: '',          disabled: true },
  { label: 'In List',            value: 'in_list'       },
  { label: 'Not In List',        value: 'not_in_list'   },
];

export const FilterNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const list      = data?.list      ?? '';
  const condition = data?.condition ?? 'equals';
  const filterVal = data?.filterVal ?? '';

  const showValue = NEEDS_VALUE.has(condition);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={filterNodeConfig}
      outputVars={FILTER_OUTPUT_VARS}
      outputHandleCount={1}
      containerProps={{ minW: '280px' }}
    >
      <VStack spacing={2} align="stretch">
        {/* List */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            List
          </FormLabel>
          <VariableTagInput
            nodeId={id}
            fieldKey="list"
            value={list}
            onChange={(val) => updateNodeField(id, 'list', val)}
            placeholder="List variable…"
            minRows={1}
          />
        </FormControl>

        {/* Condition */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Condition
          </FormLabel>
          <Select
            size="sm"
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            value={condition}
            onChange={(e) => updateNodeField(id, 'condition', e.target.value)}
          >
            {CONDITION_OPTIONS.map((opt, i) =>
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

        {/* Value — only shown when condition requires it */}
        {showValue && (
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
              Value
            </FormLabel>
            <VariableTagInput
              nodeId={id}
              fieldKey="filterVal"
              value={filterVal}
              onChange={(val) => updateNodeField(id, 'filterVal', val)}
              placeholder="Value or {{var}}…"
              minRows={1}
            />
          </FormControl>
        )}
      </VStack>
    </BaseNode>
  );
};
