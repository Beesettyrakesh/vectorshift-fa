import { FiLogOut } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const outputNodeConfig = {
  title: 'Output',
  icon: FiLogOut,
  accentColor: '#22c55e',
  inputs: [{ name: 'value' }],
  outputs: [],
  fields: [
    {
      key: 'outputName',
      label: 'Name',
      type: 'text',
      defaultValue: '',
      placeholder: 'Enter output name',
    },
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

export const OutputNode = ({ id, data, selected }) => {
  const defaultedData = {
    ...data,
    outputName:
      data?.outputName !== undefined && data.outputName !== ''
        ? data.outputName
        : id.replace('customOutput-', 'output_'),
  };

  return (
    <BaseNode id={id} data={defaultedData} selected={selected} config={outputNodeConfig} />
  );
};
