// API Call node — makes an HTTP request to a URL with an optional body.
//
// UX purpose:
//   - Method: GET/POST/PUT/DELETE/PATCH
//   - URL: static text or {{variable}} reference
//   - Body: JSON/text payload (hidden for GET/DELETE — they have no request body)
//
// Outputs: `response` (the response body), `status` (HTTP status code), `error` (if any).
// Only `response` has a right-side connection handle.

import { FiGlobe } from 'react-icons/fi';
import {
  VStack,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { BaseNode } from './BaseNode';
import { VariableTagInput } from '../controls/VariableTagInput';
import { useStore } from '../../store/index';

/** @type {import('./BaseNode').BaseNodeConfig} */
const apiCallNodeConfig = {
  title: 'API Call',
  icon: FiGlobe,
  accentColor: '#3b82f6',
  inputs: [],   // no left handles — URL/Body are filled via fields
  outputs: [],
  fields: [],
};

const API_OUTPUT_VARS = [
  { varName: 'response', type: 'Text',    description: 'Response body'       },
  { varName: 'status',   type: 'Integer', description: 'HTTP status code'    },
  { varName: 'error',    type: 'Text',    description: 'Error message if any' },
];

const METHOD_OPTIONS = [
  { label: 'GET',    value: 'GET'    },
  { label: 'POST',   value: 'POST'   },
  { label: 'PUT',    value: 'PUT'    },
  { label: 'PATCH',  value: 'PATCH'  },
  { label: 'DELETE', value: 'DELETE' },
];

// Methods that carry a request body
const HAS_BODY = new Set(['POST', 'PUT', 'PATCH']);

export const ApiCallNode = ({ id, data, selected }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);

  const method = data?.method ?? 'GET';
  const url    = data?.url    ?? '';
  const body   = data?.body   ?? '';

  const showBody = HAS_BODY.has(method);

  return (
    <BaseNode
      id={id}
      data={data}
      selected={selected}
      config={apiCallNodeConfig}
      outputVars={API_OUTPUT_VARS}
      outputHandleCount={1}
      containerProps={{ minW: '300px' }}
    >
      <VStack spacing={2} align="stretch">
        {/* Method */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            Method
          </FormLabel>
          <Select
            size="sm"
            bg="white"
            borderColor="gray.200"
            _hover={{ borderColor: 'gray.300' }}
            value={method}
            onChange={(e) => updateNodeField(id, 'method', e.target.value)}
          >
            {METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormControl>

        {/* URL */}
        <FormControl>
          <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
            URL
          </FormLabel>
          <VariableTagInput
            nodeId={id}
            fieldKey="url"
            value={url}
            onChange={(val) => updateNodeField(id, 'url', val)}
            placeholder="https://api.example.com/endpoint"
            minRows={1}
          />
        </FormControl>

        {/* Body — only for POST / PUT / PATCH */}
        {showBody && (
          <FormControl>
            <FormLabel fontSize="xs" color="gray.500" mb={0.5} fontWeight="600">
              Body
            </FormLabel>
            <VariableTagInput
              nodeId={id}
              fieldKey="body"
              value={body}
              onChange={(val) => updateNodeField(id, 'body', val)}
              placeholder='{"key": "value"} or {{var}}…'
              minRows={2}
            />
          </FormControl>
        )}
      </VStack>
    </BaseNode>
  );
};
