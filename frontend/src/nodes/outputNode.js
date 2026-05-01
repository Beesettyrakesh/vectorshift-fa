// nodes/outputNode.js
//
// Output node — sink / egress point for pipeline data. After the Task 3.2
// migration this is a thin wrapper that declares a BaseNodeConfig and
// defers all rendering to `<BaseNode />` (mirror of InputNode).
//
// Preserved invariants vs. the pre-migration implementation:
//   - Node type key:  customOutput  (unchanged in nodeRegistry)
//   - Handle id:      `${id}-value` (so existing edges still resolve)
//   - Store keys:     `outputName`, `outputType`
//   - Default name:   `output_{n}` derived from the node id.
//
// Behavior correction vs. the original:
//   The original file had a latent bug — the "Image" option had
//   `value="File"` (copy-pasted from InputNode), so selecting "Image"
//   actually stored "File". The correct pair (Text, Image) is used here
//   per design.md §9 and requirements.md FR-2.2.

import { FiLogOut } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const outputNodeConfig = {
  title: 'Output',
  icon: FiLogOut,
  accentColor: '#22c55e', // nodeAccent.io (green) — matches Input
  inputs: [{ name: 'value', label: 'Value' }],
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
  // Preserve the original auto-naming behavior: freshly dropped nodes
  // default to `output_{n}` derived from the id (e.g. `customOutput-3`
  // → `output_3`) when outputName hasn't been explicitly set.
  const defaultedData = {
    ...data,
    outputName:
      data?.outputName !== undefined && data.outputName !== ''
        ? data.outputName
        : id.replace('customOutput-', 'output_'),
  };

  return (
    <BaseNode
      id={id}
      data={defaultedData}
      selected={selected}
      config={outputNodeConfig}
    />
  );
};
