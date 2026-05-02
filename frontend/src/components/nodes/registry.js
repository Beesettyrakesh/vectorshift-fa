import {
  FiInbox,
  FiLogOut,
  FiCpu,
  FiFileText,
  FiFilter,
  FiRepeat,
  FiGlobe,
  FiClock,
  FiGitBranch,
} from 'react-icons/fi';

import { InputNode } from './Input';
import { OutputNode } from './Output';
import { LLMNode } from './LLM';
import { TextNode } from './Text';
import { FilterNode } from './Filter';
import { TransformNode } from './Transform';
import { APICallNode } from './ApiCall';
import { DelayNode } from './Delay';
import { ConditionalNode } from './Conditional';

/**
 * @typedef {Object} NodeRegistryEntry
 * @property {React.ComponentType} component
 * @property {string} label
 * @property {'io'|'ai'|'data'|'transform'|'integration'|'utility'|'logic'} category
 * @property {string} accentColor
 * @property {React.ComponentType} icon
 */

/** @type {Record<string, NodeRegistryEntry>} */
export const nodeRegistry = {
  customInput: {
    component: InputNode,
    label: 'Input',
    category: 'io',
    accentColor: '#22c55e',
    icon: FiInbox,
  },
  customOutput: {
    component: OutputNode,
    label: 'Output',
    category: 'io',
    accentColor: '#22c55e',
    icon: FiLogOut,
  },
  llm: {
    component: LLMNode,
    label: 'LLM',
    category: 'ai',
    accentColor: '#a855f7',
    icon: FiCpu,
  },
  text: {
    component: TextNode,
    label: 'Text',
    category: 'data',
    accentColor: '#06b6d4',
    icon: FiFileText,
  },
  filter: {
    component: FilterNode,
    label: 'Filter',
    category: 'transform',
    accentColor: '#f97316',
    icon: FiFilter,
  },
  transform: {
    component: TransformNode,
    label: 'Transform',
    category: 'transform',
    accentColor: '#f97316',
    icon: FiRepeat,
  },
  apiCall: {
    component: APICallNode,
    label: 'API Call',
    category: 'integration',
    accentColor: '#3b82f6',
    icon: FiGlobe,
  },
  delay: {
    component: DelayNode,
    label: 'Delay',
    category: 'utility',
    accentColor: '#f59e0b',
    icon: FiClock,
  },
  conditional: {
    component: ConditionalNode,
    label: 'Conditional',
    category: 'logic',
    accentColor: '#ef4444',
    icon: FiGitBranch,
  },
};

/** @type {Record<string, React.ComponentType>} */
export const nodeTypes = Object.fromEntries(
  Object.entries(nodeRegistry).map(([key, entry]) => [key, entry.component])
);

export const toolbarEntries = Object.entries(nodeRegistry).map(([key, entry]) => ({
  type: key,
  label: entry.label,
  category: entry.category,
  accentColor: entry.accentColor,
  icon: entry.icon,
}));
