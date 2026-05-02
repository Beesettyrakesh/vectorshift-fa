import { FiInbox } from 'react-icons/fi';
import { BaseNode } from './BaseNode';
import { getNodeOutputs } from '../../lib/variableNamespace';

/** @type {import('./BaseNode').BaseNodeConfig} */
const inputNodeConfig = {
  title: 'Input',
  icon: FiInbox,
  accentColor: '#22c55e',
  inputs: [],
  outputs: [],   // handled via outputVars → OutputsPanel (Task 21: dynamic)
  // Fix 2: removed inputName — BaseNode's shared Name field covers it
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

// Static placeholder until Task 21 makes this dynamic
const INPUT_OUTPUT_VARS = getNodeOutputs('customInput', 'Text');

export const InputNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={inputNodeConfig}
    outputVars={INPUT_OUTPUT_VARS}
  />
);
