// nodes/conditionalNode.js
//
// Conditional node — branches pipeline flow based on a boolean
// expression evaluated against the upstream value:
//
//                            ┌─ true   (when condition evaluates truthy)
//   input ──[ condition ]────┤
//                            └─ false  (otherwise)
//
// Distinct from FilterNode semantically (though the structure looks
// similar): Filter emits the value down one of two paths; Conditional is
// more canonically a boolean decision gate. Kept as a separate node to
// match VectorShift's reference categorization (Filter = transform,
// Conditional = logic).
//
// Output handle names are the string literals "true" and "false". These
// are valid object keys and are only used as handle-id suffixes
// (`${id}-true`, `${id}-false`) — never as JS identifiers — so there is
// no keyword collision risk.

import { FiGitBranch } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const conditionalNodeConfig = {
  title: 'Conditional',
  icon: FiGitBranch,
  accentColor: '#ef4444', // nodeAccent.logic (red)
  inputs: [{ name: 'input' }],
  outputs: [
    { name: 'true' },
    { name: 'false' },
  ],
  fields: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'text',
      defaultValue: '',
      placeholder: 'e.g. value !== null',
    },
  ],
};

export const ConditionalNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={conditionalNodeConfig}
  />
);
