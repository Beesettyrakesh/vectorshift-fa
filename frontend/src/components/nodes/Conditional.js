import { FiGitBranch } from 'react-icons/fi';
import { BaseNode } from './BaseNode';
import { getNodeOutputs } from '../../lib/variableNamespace';

/** @type {import('./BaseNode').BaseNodeConfig} */
const conditionalNodeConfig = {
  title: 'Conditional',
  icon: FiGitBranch,
  accentColor: '#ef4444',
  inputs: [{ name: 'input' }],
  outputs: [],   // handled via outputVars → OutputsPanel
  fields: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'text',
      defaultValue: '',
      placeholder: 'e.g. value !== null',
    },
  ],
};

const CONDITIONAL_OUTPUT_VARS = getNodeOutputs('conditional');

export const ConditionalNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={conditionalNodeConfig}
    outputVars={CONDITIONAL_OUTPUT_VARS}
  />
);
