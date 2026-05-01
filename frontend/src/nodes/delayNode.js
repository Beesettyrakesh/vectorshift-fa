// nodes/delayNode.js
//
// Delay node — pauses pipeline execution for a configurable number of
// milliseconds before forwarding its input unchanged:
//
//   input ──(wait delayMs)──▶ output
//
// First node in the pipeline to exercise BaseNode's `type: 'number'`
// field branch end-to-end — earlier nodes only used `text`, `select`,
// and `textarea`. The NumberInput + steppers are wired up via BaseNode's
// `renderField` switch; no per-node work required.

import { FiClock } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const delayNodeConfig = {
  title: 'Delay',
  icon: FiClock,
  accentColor: '#f59e0b', // nodeAccent.utility (amber)
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
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={delayNodeConfig}
  />
);
