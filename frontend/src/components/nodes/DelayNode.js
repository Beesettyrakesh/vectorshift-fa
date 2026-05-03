import { FiClock } from 'react-icons/fi';
import { BaseNode } from './BaseNode';
import { getNodeOutputs } from '../../lib/variableNamespace';

/** @type {import('./BaseNode').BaseNodeConfig} */
const delayNodeConfig = {
  title: 'Delay',
  icon: FiClock,
  accentColor: '#f59e0b',
  inputs: [{ name: 'input' }],
  outputs: [],  // handled via outputVars → OutputsPanel
  fields: [
    {
      key: 'delayMs',
      label: 'Delay (ms)',
      type: 'number',
      defaultValue: 1000,
      min: 0,
      step: 100,
      placeholder: '1000',
    },
  ],
};

// Phase-2 static output vars for Delay node
const DELAY_OUTPUT_VARS = getNodeOutputs('delay');

export const DelayNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={delayNodeConfig}
    outputVars={DELAY_OUTPUT_VARS}
    outputHandleCount={1}
  />
);
