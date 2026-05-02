import { FiInbox } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const inputNodeConfig = {
  title: 'Input',
  icon: FiInbox,
  accentColor: '#22c55e',
  inputs: [],
  outputs: [{ name: 'value' }],
  fields: [
    {
      key: 'inputName',
      label: 'Name',
      type: 'text',
      defaultValue: '',
      placeholder: 'Enter input name',
    },
    {
      key: 'inputType',
      label: 'Type',
      type: 'select',
      defaultValue: 'Text',
      options: [
        { label: 'Text', value: 'Text' },
        { label: 'File', value: 'File' },
      ],
    },
  ],
};

export const InputNode = ({ id, data, selected }) => {
  const defaultedData = {
    ...data,
    inputName:
      data?.inputName !== undefined && data.inputName !== ''
        ? data.inputName
        : id.replace('customInput-', 'input_'),
  };

  return (
    <BaseNode id={id} data={defaultedData} selected={selected} config={inputNodeConfig} />
  );
};
