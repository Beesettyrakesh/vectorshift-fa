// nodes/transformNode.js
//
// Transform node — applies a user-supplied expression to its input and
// emits the result. The simplest of the five new demonstration nodes:
// one input, one output, one text field.
//
//   input ──[ expression ]──▶ output
//
// Pipeline semantics (expression evaluation) are out of scope; this node
// persists the expression string into the store so a future executor
// could parse and apply it.
//
// Paired with FilterNode under the same "transform" category (orange
// accent) because both manipulate data flowing through the pipeline.

import { FiRepeat } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const transformNodeConfig = {
  title: 'Transform',
  icon: FiRepeat,
  accentColor: '#f97316', // nodeAccent.transform (orange)
  inputs: [{ name: 'input' }],
  outputs: [{ name: 'output' }],
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

export const TransformNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={transformNodeConfig}
  />
);
