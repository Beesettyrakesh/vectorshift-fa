// lib/variableNamespace.js
//
// Pure-function module (no React, no Zustand imports).
// Owns the variable-namespace system used by Phase-2 nodes:
//   - buildNamespace  → build a namespace map from all nodes
//   - parseRefs       → extract {{node.var}} references from text
//   - validateRef     → check whether a reference is valid
//   - cascadeRename   → update all references when a node is renamed
//
// All functions are pure / side-effect-free so they can be tested
// independently and called from any context (store actions, React
// components, or future property-based tests).

// ---------------------------------------------------------------------------
// Output variable definitions (per node type)
// ---------------------------------------------------------------------------
//
// Each entry has:
//   varName     - the snake_case identifier used in {{nodeName.varName}}
//   type        - display type badge: 'Text'|'Integer'|'Decimal'|'List'|'Path'|'Any'
//   description - one-liner shown in the Outputs panel

/** Output variable definitions for every node type that has outputs. */
const NODE_OUTPUTS = {
  // customInput — varies based on data.inputType; handled specially in buildNamespace
  customInput: {
    Text: [
      { varName: 'text', type: 'Text', description: 'The text that was passed in' },
    ],
    File: [
      { varName: 'filename', type: 'Text', description: 'The filename of the uploaded file' },
      { varName: 'processed_text', type: 'Text', description: 'The file content as a single string' },
      { varName: 'list', type: 'Text', description: 'The items as a list (one per line)' },
    ],
  },

  // customOutput — no outputs
  customOutput: [],

  llm: [
    { varName: 'response', type: 'Text', description: 'The response as a single string' },
    { varName: 'tokens_used', type: 'Integer', description: 'The number of tokens used' },
    { varName: 'input_tokens', type: 'Integer', description: 'The number of input tokens' },
    { varName: 'output_tokens', type: 'Integer', description: 'The number of output tokens' },
    { varName: 'credits_used', type: 'Decimal', description: 'The number of credits used' },
  ],

  text: [
    { varName: 'result', type: 'Text', description: 'The text content' },
  ],

  apiCall: [
    { varName: 'response', type: 'Text', description: 'The response from the API' },
  ],

  filter: [
    { varName: 'passed', type: 'List', description: 'Items that matched the filter' },
    { varName: 'count', type: 'Integer', description: 'Number of items that passed' },
  ],

  transform: [
    { varName: 'output', type: 'Any', description: 'The transformed result' },
    { varName: 'error', type: 'Text', description: 'Any error message from the transform' },
  ],

  delay: [
    { varName: 'output', type: 'Any', description: 'The input, passed through after the delay' },
  ],

  conditional: [
    { varName: 'true_path', type: 'Path', description: 'Taken when condition is true' },
    { varName: 'false_path', type: 'Path', description: 'Taken when condition is false' },
  ],
};

// ---------------------------------------------------------------------------
// buildNamespace(nodes)
// ---------------------------------------------------------------------------

/**
 * Build a namespace map from the Zustand store's nodes array.
 *
 * @param {Array<{id: string, type: string, data: Object}>} nodes
 * @returns {Record<string, {nodeId: string, nodeType: string, outputs: Array<{varName: string, type: string, description: string}>}>}
 *   Key = node's data.nodeName (e.g. "input_0")
 *   Value = { nodeId, nodeType, outputs }
 *
 * Nodes without a nodeName are excluded from the namespace (they're not
 * yet referenceable until the user assigns a name or the default kicks in).
 */
export function buildNamespace(nodes) {
  const namespace = {};

  for (const node of nodes) {
    const nodeName = node.data?.nodeName;
    if (!nodeName) continue;

    let outputs;
    if (node.type === 'customInput') {
      const inputType = node.data?.inputType ?? 'Text';
      outputs = NODE_OUTPUTS.customInput[inputType] ?? NODE_OUTPUTS.customInput.Text;
    } else {
      outputs = NODE_OUTPUTS[node.type] ?? [];
    }

    namespace[nodeName] = {
      nodeId: node.id,
      nodeType: node.type,
      outputs,
    };
  }

  return namespace;
}

// ---------------------------------------------------------------------------
// parseRefs(text)
// ---------------------------------------------------------------------------

/**
 * Extract all {{nodeName.varName}} references from a text string.
 *
 * The pattern requires:
 *   - nodeName: valid identifier (letters, digits, underscores; not starting with digit)
 *   - a literal dot separator
 *   - varName: same identifier rules
 *
 * Overlapping / malformed references (e.g. {{foo}} without a dot) are not
 * returned — they'll be caught by the invalid-reference highlighting logic.
 *
 * @param {string} text
 * @returns {Array<{nodeName: string, varName: string, raw: string}>}
 */
export function parseRefs(text) {
  if (!text) return [];

  const REF_PATTERN = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\.\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const results = [];
  let match;

  while ((match = REF_PATTERN.exec(text)) !== null) {
    results.push({
      nodeName: match[1],
      varName: match[2],
      raw: match[0],
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// validateRef(namespace, nodeName, varName)
// ---------------------------------------------------------------------------

/**
 * Check whether a reference is valid in the given namespace.
 *
 * A reference is valid iff:
 *   1. `nodeName` exists as a key in `namespace`, AND
 *   2. `varName` is in that node's outputs list.
 *
 * @param {ReturnType<typeof buildNamespace>} namespace
 * @param {string} nodeName
 * @param {string} varName
 * @returns {boolean}
 */
export function validateRef(namespace, nodeName, varName) {
  const entry = namespace[nodeName];
  if (!entry) return false;
  return entry.outputs.some((o) => o.varName === varName);
}

// ---------------------------------------------------------------------------
// cascadeRename(nodes, oldName, newName)
// ---------------------------------------------------------------------------

/**
 * Replace all occurrences of {{oldName.xxx}} with {{newName.xxx}} in every
 * variable-aware text field of every node.
 *
 * Variable-aware field keys (by node type):
 *   llm         → systemPrompt, prompt
 *   filter      → list, expressionValue
 *   transform   → input, customExpression
 *   apiCall     → url, body
 *   conditional → conditionInput, conditionValue
 *   text        → text
 *
 * @param {Array} nodes  - The Zustand store nodes array
 * @param {string} oldName - The node's previous nodeName
 * @param {string} newName - The node's new nodeName
 * @returns {Array} A new nodes array with all references updated (deep-ish copy)
 */
export function cascadeRename(nodes, oldName, newName) {
  if (!oldName || !newName || oldName === newName) return nodes;

  // Pattern matches {{oldName.varName}} with optional whitespace around each part.
  // We build it dynamically from oldName so special-regex chars are escaped.
  const escaped = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\{\\{\\s*${escaped}\\s*\\.\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\}\\}`,
    'g'
  );
  const replacement = `{{${newName}.$1}}`;

  const VAR_AWARE_FIELDS = {
    llm: ['systemPrompt', 'prompt'],
    filter: ['list', 'filterVal'],       // filterVal is the actual key in FilterNode.js
    transform: ['input', 'expression'],  // expression is the actual key in TransformNode.js
    apiCall: ['url', 'body'],
    conditional: ['input', 'value'],     // input + value are the actual keys in ConditionalNode.js
    text: ['text'],
    customOutput: ['filename'],          // filename shown when outputType === 'File'
  };

  return nodes.map((node) => {
    const fields = VAR_AWARE_FIELDS[node.type];
    if (!fields) return node;

    let dataChanged = false;
    const newData = { ...node.data };

    for (const field of fields) {
      const val = node.data?.[field];
      if (typeof val !== 'string') continue;
      const updated = val.replace(pattern, replacement);
      if (updated !== val) {
        newData[field] = updated;
        dataChanged = true;
      }
    }

    if (!dataChanged) return node;
    return { ...node, data: newData };
  });
}

// ---------------------------------------------------------------------------
// isValidIdentifier(name)
// ---------------------------------------------------------------------------

/**
 * Check whether a string is a valid node Name identifier.
 *
 * Rules: starts with a letter or underscore, followed by letters/digits/underscores,
 * no spaces, no leading digit.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function isValidIdentifier(name) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

// ---------------------------------------------------------------------------
// getNodeOutputs(nodeType, inputType?)
// ---------------------------------------------------------------------------

/**
 * Return the output variable list for a given node type.
 * For customInput nodes, also pass the current inputType ('Text' | 'File').
 *
 * Convenience helper used by the Outputs panel renderer.
 *
 * @param {string} nodeType
 * @param {string} [inputType]
 * @returns {Array<{varName: string, type: string, description: string}>}
 */
export function getNodeOutputs(nodeType, inputType) {
  if (nodeType === 'customInput') {
    return NODE_OUTPUTS.customInput[inputType ?? 'Text'] ?? NODE_OUTPUTS.customInput.Text;
  }
  return NODE_OUTPUTS[nodeType] ?? [];
}
