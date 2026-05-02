import { FiRepeat } from 'react-icons/fi';
import { BaseNode } from './BaseNode';
import { getNodeOutputs } from '../../lib/variableNamespace';

/** @type {import('./BaseNode').BaseNodeConfig} */
const transformNodeConfig = {
  title: 'Transform',
  icon: FiRepeat,
  accentColor: '#f97316',
  inputs: [{ name: 'input' }],
  outputs: [],   // handled via outputVars → OutputsPanel
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

const TRANSFORM_OUTPUT_VARS = getNodeOutputs('transform');

export const TransformNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={transformNodeConfig}
    outputVars={TRANSFORM_OUTPUT_VARS}
    outputHandleCount={1}
  />
);
