import { FiFilter } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const filterNodeConfig = {
  title: 'Filter',
  icon: FiFilter,
  accentColor: '#f97316',
  inputs: [{ name: 'input' }],
  outputs: [],
  fields: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'text',
      defaultValue: '',
      placeholder: 'e.g. value > 0',
    },
  ],
};

// 1 output row: "passed"
const FILTER_OUTPUT_VARS = [
  { varName: 'passed', type: 'List', description: 'Items that matched the condition' },
];

export const FilterNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={filterNodeConfig}
    outputVars={FILTER_OUTPUT_VARS}
  />
);
