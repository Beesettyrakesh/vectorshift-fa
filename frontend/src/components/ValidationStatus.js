// ValidationStatus.js — tiny status chip pinned to the toolbar (top-right,
// beside the Run button). Reflects the auto-validate state driven by the
// debounced POST /pipelines/parse triggered on connect/delete.
//
// Subscribes to the pub/sub bus in validatePipeline.js (NOT the Zustand
// store) because status is transient UI chrome, not pipeline state.

import { useEffect, useState } from 'react';
import { Box, HStack, Spinner, Text } from '@chakra-ui/react';
import {
  getAutoValidateStatus,
  subscribeAutoValidateStatus,
} from '../validatePipeline';

const STATUS_META = {
  idle: { color: 'gray.400', label: 'Idle' },
  validating: { color: 'blue.400', label: 'Validating…' },
  dag: { color: 'green.400', label: '✓ DAG' },
  cycle: { color: 'orange.400', label: '⚠ Cycle detected' },
  error: { color: 'red.400', label: '✕ Backend unreachable' },
};

export const ValidationStatus = () => {
  const [status, setStatus] = useState(getAutoValidateStatus());

  useEffect(() => subscribeAutoValidateStatus(setStatus), []);

  const meta = STATUS_META[status] ?? STATUS_META.idle;
  const isValidating = status === 'validating';

  return (
    <HStack spacing={2} fontSize="xs" color="gray.600" aria-live="polite">
      {isValidating ? (
        <Spinner size="xs" color={meta.color} />
      ) : (
        <Box w={2} h={2} borderRadius="full" bg={meta.color} />
      )}
      <Text>{meta.label}</Text>
    </HStack>
  );
};
