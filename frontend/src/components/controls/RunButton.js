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
import { shallow } from 'zustand/shallow';
import { useStore } from '../../store/index';
import { validatePipeline, clearCycleHighlight } from '../../lib/validatePipeline';

const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

const STATUS_COLOR = {
  success: 'green.400',
  warning: 'orange.400',
  error: 'red.400',
};

export const RunButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { nodes, edges } = useStore(selector, shallow);

  const onRun = async () => {
    setIsLoading(true);
    try {
      const data = await validatePipeline(nodes, edges);
      const { num_nodes, num_edges, is_dag } = data;

      setResult({
        title: is_dag ? 'Pipeline Parsed' : 'Cycle Detected',
        status: is_dag ? 'success' : 'warning',
        lines: [
          `Nodes: ${num_nodes}`,
          `Edges: ${num_edges}`,
          `Is DAG: ${is_dag ? 'Yes' : 'No'}`,
        ],
        hint: is_dag
          ? null
          : 'The red-highlighted nodes and edges form a cycle and cannot be executed as a DAG.',
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
        loadingText="Running…"
        minW="80px"
      >
        Run
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
