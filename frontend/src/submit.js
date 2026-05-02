// submit.js — posts the pipeline to /pipelines/parse and shows the result
// in a centered modal (success / cycle / error), dismissed by OK, ×, the
// overlay, or Escape.

import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
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
import { useStore } from './store';

const PARSE_URL = 'http://localhost:8000/pipelines/parse';

const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

const STATUS_COLOR = {
  success: 'green.400',
  warning: 'orange.400',
  error: 'red.400',
};

export const SubmitButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { title, status, lines[], hint? }
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { nodes, edges } = useStore(selector, shallow);

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        nodes: nodes.map((n) => ({ id: n.id, type: n.type, data: n.data })),
        edges: edges.map((e) => ({ source: e.source, target: e.target })),
      };

      const res = await fetch(PARSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const { num_nodes, num_edges, is_dag } = await res.json();

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
          : 'Your pipeline contains a cycle and cannot be executed as a DAG.',
      });
    } catch (err) {
      setResult({
        title: 'Submit Failed',
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
      <Flex
        as="footer"
        justify="center"
        align="center"
        py={4}
        px={6}
        bg="toolbar.bg"
        borderTopWidth="1px"
        borderTopColor="gray.200"
      >
        <Button
          colorScheme="brand"
          size="lg"
          onClick={onSubmit}
          isLoading={isLoading}
          loadingText="Submitting..."
          minW="200px"
        >
          Submit Pipeline
        </Button>
      </Flex>

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
