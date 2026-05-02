import { useEffect, useState } from 'react';
import { Badge, HStack, Spinner } from '@chakra-ui/react';
import {
  getAutoValidateStatus,
  subscribeAutoValidateStatus,
} from '../../lib/validatePipeline';

const STATUS_META = {
  idle:       { colorScheme: 'gray',   label: 'Idle'                },
  validating: { colorScheme: 'blue',   label: 'Validating…'         },
  dag:        { colorScheme: 'green',  label: '✓ Valid DAG'         },
  cycle:      { colorScheme: 'orange', label: '⚠ Cycle Detected'   },
  error:      { colorScheme: 'red',    label: '✕ Backend Error'     },
};

export const ValidationStatus = () => {
  const [status, setStatus] = useState(getAutoValidateStatus());

  useEffect(() => subscribeAutoValidateStatus(setStatus), []);

  const meta = STATUS_META[status] ?? STATUS_META.idle;
  const isValidating = status === 'validating';

  return (
    <HStack spacing={2} aria-live="polite">
      {isValidating && <Spinner size="xs" color={`${meta.colorScheme}.500`} />}
      <Badge
        colorScheme={meta.colorScheme}
        variant="solid"
        fontSize="xs"
        fontWeight="700"
        px={2}
        py={0.5}
        borderRadius="md"
        letterSpacing="0.02em"
      >
        {meta.label}
      </Badge>
    </HStack>
  );
};
