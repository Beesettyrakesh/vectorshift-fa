// nodes/filterNode.js
//
// Filter node — first of the five new demonstration nodes (Task 5.1).
// Splits a single input into two possible output paths based on a user-
// supplied condition expression:
//
//   input ─┬─ passed   (when condition evaluates truthy)
//          └─ rejected (when condition evaluates falsy)
//
// Pipeline semantics (actual evaluation) are out of scope for the
// frontend assessment; this node only needs to render + expose its
// handles + persist the `condition` field into the store so a future
// executor could consume it.
//
// Convention for the two outputs: `passed` is the TOP handle (first in
// the outputs array), `rejected` is the BOTTOM handle (second). The
// BaseNode `handleTop` formula places them at 33% and 66% respectively.

import { FiFilter } from 'react-icons/fi';
import { BaseNode } from '../components/BaseNode';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const filterNodeConfig = {
  title: 'Filter',
  icon: FiFilter,
  accentColor: '#f97316', // nodeAccent.transform (orange)
  inputs: [{ name: 'input' }],
  outputs: [
    { name: 'passed' },
    { name: 'rejected' },
  ],
  fields: [
    {
      key: 'condition',
      label: 'Condition',
      type: 'text',
      defaultValue: '',
      placeholder: 'e.g. value > 0',
    },
  ],
};

export const FilterNode = ({ id, data, selected }) => (
  <BaseNode
    id={id}
    data={data}
    selected={selected}
    config={filterNodeConfig}
  />
);
