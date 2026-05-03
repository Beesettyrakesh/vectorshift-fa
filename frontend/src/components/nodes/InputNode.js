import { useEffect } from 'react';
import { FiInbox } from 'react-icons/fi';
import { useUpdateNodeInternals } from 'reactflow';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const inputNodeConfig = {
  title: 'Input',
  icon: FiInbox,
  accentColor: '#22c55e',
  inputs: [],
  outputs: [],
  fields: [
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

const TEXT_OUTPUT_VARS = [
  { varName: 'text', type: 'Text', description: 'The text that was provided' },
];

const FILE_OUTPUT_VARS = [
  { varName: 'filename',       type: 'Text', description: 'Original file name'         },
  { varName: 'processed_text', type: 'Text', description: 'Extracted text content'     },
  { varName: 'list',           type: 'List', description: 'Lines split into a list'    },
];

export const InputNode = ({ id, data, selected }) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const inputType = data?.inputType ?? 'Text';

  // Re-flow handle positions whenever the type changes
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputType, updateNodeInternals]);

  const outputVars = inputType === 'File' ? FILE_OUTPUT_VARS : TEXT_OUTPUT_VARS;

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={inputNodeConfig}
      outputVars={outputVars}
      outputHandleCount={1}
    />
  );
};
