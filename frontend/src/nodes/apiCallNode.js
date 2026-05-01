// nodes/apiCallNode.js
//
// API Call node — performs an outbound HTTP request. Exposes the URL and
// request body as input handles so upstream nodes can supply them
// dynamically, and emits the response or an error down one of two output
// paths:
//
//   url  ─┐                   ┌─ response  (on 2xx)
//         ├─[ method + url ]──┤
//   body ─┘                   └─ error     (on network / non-2xx)
//
// The user can also type a static URL into the body form — when both a
// static value and a connected handle are present a future executor would
// prefer the connected upstream value. This "field OR handle" duality is
// intentional and validates that BaseNode doesn't need to special-case
// fields whose key overlaps with a handle name.

import { FiGlobe } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const apiCallNodeConfig = {
  title: 'API Call',
  icon: FiGlobe,
  accentColor: '#3b82f6', // nodeAccent.integration (blue)
  inputs: [
    { name: 'url' },
    { name: 'body' },
  ],
  outputs: [
    { name: 'response' },
    { name: 'error' },
  ],
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

export const APICallNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={apiCallNodeConfig}
  />
);
