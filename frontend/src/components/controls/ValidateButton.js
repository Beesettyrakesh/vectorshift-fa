import { useState } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import { useShallow } from 'zustand/react/shallow';
// Renamed from RunButton — button label changed from "Run" to "Validate"
import { useStore } from '../../store/index';
import { runAutoValidate, clearCycleHighlight, getAutoValidateStatus } from '../../lib/validatePipeline';

const STATUS_COLOR = {
  success: 'green.400',
  warning: 'orange.400',
  error: 'red.400',
};

const selector = (s) => ({
  nodes: s.nodes,
  edges: s.edges,
  autoEdges: s.autoEdges ?? [],
});

export const ValidateButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { nodes, edges, autoEdges } = useStore(useShallow(selector));

  // Disabled when canvas is empty or no connections exist (real or auto)
  const allEdgeCount = edges.length + autoEdges.length;
  const canRun = nodes.length > 0 && allEdgeCount > 0;
  const disabledTitle =
    nodes.length === 0
      ? 'Add nodes to the canvas first'
      : allEdgeCount === 0
      ? 'Connect at least two nodes before running'
      : undefined;

  const onRun = async () => {
    setIsLoading(true);
    try {
      // runAutoValidate reads store.edges + store.autoEdges, deduplicates, sends
      // to backend, and now returns the parsed response (num_nodes, num_edges, is_dag).
      // Using backend counts is authoritative — avoids any client-side double-counting
      // of auto-edges that share the same source→target as a real edge.
      const data = await runAutoValidate();
      const status = getAutoValidateStatus();
      const isDAG = status === 'dag';
      setResult({
        title: isDAG ? 'Pipeline Parsed' : status === 'error' ? 'Run Failed' : 'Cycle Detected',
        status: isDAG ? 'success' : status === 'error' ? 'error' : 'warning',
        lines:
          data != null
            ? [
                `Nodes: ${data.num_nodes}`,
                `Edges: ${data.num_edges}`,
                `Is DAG: ${isDAG ? 'Yes' : 'No'}`,
              ]
            : ['Could not reach the backend.'],
        hint:
          status === 'cycle'
            ? 'The red-highlighted nodes and edges form a cycle and cannot be executed as a DAG.'
            : status === 'error'
            ? 'Make sure the backend is running on http://localhost:8000.'
            : null,
      });
    } catch (err) {
      clearCycleHighlight();
      setResult({
        title: 'Run Failed',
        status: 'error',
        lines: [err?.message ?? 'Could not reach the backend.'],
        hint: 'Make sure the backend is running on http://localhost:8000.',
      });
    } finally {
      setIsLoading(false);
      onOpen();
    }
  };

  return (
    <>
      <Button
        colorScheme="brand"
        size="sm"
        onClick={onRun}
        isLoading={isLoading}
        isDisabled={!canRun}
        loadingText="Validating…"
        minW="80px"
        title={disabledTitle}
      >
        Validate
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader display="flex" alignItems="center" gap={2}>
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg={STATUS_COLOR[result?.status] ?? 'gray.400'}
            />
            {result?.title}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="start" spacing={1}>
              {result?.lines?.map((line, i) => (
                <Text key={i} fontSize="sm" fontFamily="mono">
                  {line}
                </Text>
              ))}
            </VStack>
            {result?.hint ? (
              <Text mt={3} fontSize="xs" color="gray.500">
                {result.hint}
              </Text>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="brand" onClick={onClose}>
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
