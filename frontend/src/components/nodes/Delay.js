import { FiClock } from 'react-icons/fi';
import { BaseNode } from './BaseNode';

/** @type {import('./BaseNode').BaseNodeConfig} */
const delayNodeConfig = {
  title: 'Delay',
  icon: FiClock,
  accentColor: '#f59e0b',
  inputs: [{ name: 'input' }],
  outputs: [{ name: 'output' }],
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

export const DelayNode = ({ id, data, selected }) => (
  <BaseNode id={id} data={data} selected={selected} config={delayNodeConfig} />
);
