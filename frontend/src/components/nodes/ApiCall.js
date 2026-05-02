import { FiGlobe } from 'react-icons/fi';
import { BaseNode } from './BaseNode';
import { getNodeOutputs } from '../../lib/variableNamespace';

/** @type {import('./BaseNode').BaseNodeConfig} */
const apiCallNodeConfig = {
  title: 'API Call',
  icon: FiGlobe,
  accentColor: '#3b82f6',
  inputs: [{ name: 'url' }, { name: 'body' }],
  outputs: [],  // handled via outputVars → OutputsPanel
  fields: [
    {
      key: 'method',
      label: 'Method',
      type: 'select',
      defaultValue: 'GET',
      options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
      ],
    },
    {
      key: 'url',
      label: 'URL',
      type: 'text',
      defaultValue: '',
      placeholder: 'https://api.example.com/...',
    },
  ],
};

// Phase-2 static output vars for API Call node
const API_OUTPUT_VARS = getNodeOutputs('apiCall');

export const APICallNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={apiCallNodeConfig}
    outputVars={API_OUTPUT_VARS}
    outputHandleCount={1}
  />
);
