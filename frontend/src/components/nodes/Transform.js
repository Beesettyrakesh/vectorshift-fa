import { FiRepeat } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const transformNodeConfig = {
  title: 'Transform',
  icon: FiRepeat,
  accentColor: '#f97316',
  inputs: [{ name: 'input' }],
  outputs: [{ name: 'output' }],
  fields: [
    {
      key: 'expression',
      label: 'Expression',
      type: 'text',
      defaultValue: '',
      placeholder: 'e.g. value * 2',
    },
  ],
};

export const TransformNode = ({ id, data, selected }) => (
  <BaseNode id={id} data={data} selected={selected} config={transformNodeConfig} />
);
