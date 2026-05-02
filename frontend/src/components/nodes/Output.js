import { FiLogOut } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const outputNodeConfig = {
  title: 'Output',
  icon: FiLogOut,
  accentColor: '#22c55e',
  inputs: [{ name: 'value' }],
  outputs: [],   // Output node intentionally has no Outputs panel
  // Fix 2: removed outputName — BaseNode's shared Name field covers it
  fields: [
    {
      key: 'outputType',
      label: 'Type',
      type: 'select',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'Image', value: 'Image' },
      ],
    },
  ],
};

export const OutputNode = ({ id, data, selected }) => (
  <BaseNode id={id} data={data} selected={selected} config={outputNodeConfig} />
);
