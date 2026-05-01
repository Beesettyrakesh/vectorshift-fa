// nodes/textNode.js
//
// Text node — free-form text/template block. This is the BASIC Task 3.4
// migration only:
//   - Card + title + handles rendered via BaseNode (consistent with other
//     node types).
//   - Body is a Chakra Textarea passed as `children`, bound directly to
//     `data.text` via the store action `updateNodeField`.
//
// Task 7.1 will later replace the plain Textarea with an auto-resizing
// variant that clamps width to 200-500px, and Task 8.1 will add dynamic
// input handles generated from `{{ variable }}` patterns detected in the
// text. Both features will sit in this wrapper — BaseNode already accepts
// `dynamicInputs` and `containerProps` props specifically for that.
//
// Preserved invariants vs. the pre-migration implementation:
//   - Node type key:  text
//   - Handle id:      `${id}-output`
//   - Store key:      `text`
//   - Initial text:   defaults to "{{input}}" on a fresh drop (matches the
//                     old `useState(data?.text || '{{input}}')` behavior).

import { FiFileText } from 'react-icons/fi';
import { Textarea } from '@chakra-ui/react';
import { BaseNode } from '../components/BaseNode';
import { useStore } from '../store';

const DEFAULT_TEXT = '{{input}}';

/** @type {import('../components/BaseNode').BaseNodeConfig} */
const textNodeConfig = {
  title: 'Text',
  icon: FiFileText,
  accentColor: '#06b6d4', // nodeAccent.data (cyan)
  inputs: [], // Task 8.1 will drive this dynamically from detected {{ vars }}.
  outputs: [{ name: 'output', label: 'Output' }],
  fields: [], // Textarea is passed as children — BaseNode skips auto-fields.
};

export const TextNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((state) => state.updateNodeField);

  // Read the current text from the store; fall back to the default for a
  // freshly dropped node that has never had `text` set. Avoid writing the
  // default into the store here — we only persist once the user edits,
  // which keeps the "never touched" vs "user cleared it" distinction.
  const text = data?.text !== undefined ? data.text : DEFAULT_TEXT;

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={textNodeConfig}
    >
      <Textarea
        size="sm"
        rows={3}
        resize="none"
        value={text}
        onChange={(e) => updateNodeField(id, 'text', e.target.value)}
        bg="white"
        borderColor="gray.200"
        _hover={{ borderColor: 'gray.300' }}
        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
        placeholder="Enter text..."
      />
    </BaseNode>
  );
};
