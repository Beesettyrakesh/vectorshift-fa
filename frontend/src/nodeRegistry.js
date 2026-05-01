import {
  FiInbox,
  FiLogOut,
  FiCpu,
  FiFileText,
} from 'react-icons/fi';

import { InputNode } from './nodes/inputNode';
import { OutputNode } from './nodes/outputNode';
import { LLMNode } from './nodes/llmNode';
import { TextNode } from './nodes/textNode';

/**
 * @typedef {Object} NodeRegistryEntry
 * @property {React.ComponentType} component  The React component (usually a thin wrapper over `<BaseNode />`)
 * @property {string} label                   Display name shown in the Toolbar
 * @property {'io'|'ai'|'data'|'transform'|'integration'|'utility'|'logic'} category   Logical grouping (see design.md §9)
 * @property {string} accentColor             Hex color matching the node's title bar accent (also used on the Toolbar chip's left border)
 * @property {React.ComponentType} icon       `react-icons` component
 */

/**
 * Registry keyed by the ReactFlow node `type` string. The key is what gets
 * stored in `node.type` (in the Zustand store) and what the Toolbar's
 * draggable chip writes into `dataTransfer` — it MUST remain stable; renaming
 * a key is a breaking change for any saved pipeline.
 *
 * @type {Record<string, NodeRegistryEntry>}
 */
export const nodeRegistry = {
  customInput: {
    component: InputNode,
    label: 'Input',
    category: 'io',
    accentColor: '#22c55e', // nodeAccent.io
    icon: FiInbox,
  },
  customOutput: {
    component: OutputNode,
    label: 'Output',
    category: 'io',
    accentColor: '#22c55e', // nodeAccent.io
    icon: FiLogOut,
  },
  llm: {
    component: LLMNode,
    label: 'LLM',
    category: 'ai',
    accentColor: '#a855f7', // nodeAccent.ai
    icon: FiCpu,
  },
  text: {
    component: TextNode,
    label: 'Text',
    category: 'data',
    accentColor: '#06b6d4', // nodeAccent.data
    icon: FiFileText,
  },
  // filter, transform, apiCall, delay, conditional — added in Tasks 5.1–5.5
};

/**
 * Derived map for ReactFlow's `nodeTypes` prop. ReactFlow expects an object
 * where keys are the node `type` strings and values are the components.
 *
 * @type {Record<string, React.ComponentType>}
 */
export const nodeTypes = Object.fromEntries(
  Object.entries(nodeRegistry).map(([key, entry]) => [key, entry.component])
);

/**
 * Derived array for the Toolbar. Each entry carries everything a Toolbar
 * chip needs to render itself and initiate a drag — no further lookups
 * required.
 *
 * @type {Array<{ type: string, label: string, category: string,
 *               accentColor: string, icon: React.ComponentType }>}
 */
export const toolbarEntries = Object.entries(nodeRegistry).map(
  ([key, entry]) => ({
    type: key,
    label: entry.label,
    category: entry.category,
    accentColor: entry.accentColor,
    icon: entry.icon,
  })
);
