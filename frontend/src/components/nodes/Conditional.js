import { FiGitBranch } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const conditionalNodeConfig = {
  title: 'Conditional',
  icon: FiGitBranch,
  accentColor: '#ef4444',
  inputs: [{ name: 'input' }],
  outputs: [{ name: 'true' }, { name: 'false' }],
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

export const ConditionalNode = ({ id, data, selected }) => (
  <BaseNode id={id} data={data} selected={selected} config={conditionalNodeConfig} />
);
