// nodes/inputNode.js
//
// Input node — entry point for external data into a pipeline. After the
// Task 3.1 migration this is a thin wrapper that declares a BaseNodeConfig
// and defers all rendering to `<BaseNode />`.
//
// Preserved invariants vs. the pre-migration implementation:
//   - Node type key:  customInput   (unchanged in nodeRegistry)
//   - Handle id:      `${id}-value` (so existing edges still resolve)
//   - Store keys:     `inputName`, `inputType` (so any persisted pipeline
//                     data round-trips without migration)
//   - Default name:   `input_{n}` where {n} is the numeric suffix of the
//                     node id — reproduces the old `useState` initial value.

import { FiInbox } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const inputNodeConfig = {
  title: 'Input',
  icon: FiInbox,
  accentColor: '#22c55e', // nodeAccent.io (green)
  inputs: [],
  outputs: [{ name: 'value', label: 'Value' }],
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
  // Preserve the original behavior: if this node was freshly dropped and no
  // inputName has been set yet, default to `input_{n}` derived from the id
  // (e.g., `customInput-3` → `input_3`). Once the user edits the field the
  // derived value is overridden via the store.
  const defaultedData = {
    ...data,
    inputName:
      data?.inputName !== undefined && data.inputName !== ''
        ? data.inputName
        : id.replace('customInput-', 'input_'),
  };

  return (
    <BaseNode
      id={id}
      data={defaultedData}
      selected={selected}
      config={inputNodeConfig}
    />
  );
};
