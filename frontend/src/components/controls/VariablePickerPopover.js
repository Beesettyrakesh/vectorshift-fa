// components/controls/VariablePickerPopover.js
//
// Two-stage variable picker popover used by VariableTextInput and VariableTextarea.
//
// Stage 1: list all nodes in the namespace (excluding self).
// Stage 2: list output variables of the selected node with type badges.
// Selecting a variable calls onInsert('{{nodeName.varName}}').

import { useState, useCallback, useMemo } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Box,
  Flex,
  Text,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { buildNamespace } from '../../lib/variableNamespace';
import { useStore } from '../../store/index';

const TYPE_BADGE_COLOR = {
  Text:    { bg: '#dbeafe', color: '#1d4ed8' },
  Integer: { bg: '#fce7f3', color: '#9d174d' },
  Decimal: { bg: '#ede9fe', color: '#5b21b6' },
  List:    { bg: '#d1fae5', color: '#065f46' },
  Path:    { bg: '#ffedd5', color: '#9a3412' },
  Any:     { bg: '#f3f4f6', color: '#374151' },
};

const TypeBadge = ({ type }) => {
  const style = TYPE_BADGE_COLOR[type] ?? TYPE_BADGE_COLOR.Any;
  return (
    <Box
      as="span"
      display="inline-block"
      px={1.5}
      fontSize="9px"
      fontWeight="700"
      letterSpacing="0.05em"
      textTransform="uppercase"
      borderRadius="sm"
      bg={style.bg}
      color={style.color}
      lineHeight="18px"
      flexShrink={0}
    >
      {type}
    </Box>
  );
};

const NODE_TYPE_LABEL = {
  customInput: 'Input',
  customOutput: 'Output',
  llm: 'LLM',
  text: 'Text',
  filter: 'Filter',
  transform: 'Transform',
  apiCall: 'API Call',
  delay: 'Delay',
  conditional: 'Conditional',
};

/**
 * @param {boolean}    isOpen       Controlled open state
 * @param {Function}   onClose      Close the popover
 * @param {string}     nodeId       Self node id (to exclude from namespace)
 * @param {Function}   onInsert     (text: string) => void — called with '{{name.var}}'
 * @param {React.ReactNode} children  The trigger element
 */
export const VariablePickerPopover = ({ isOpen, onClose, nodeId, onInsert, children }) => {
  const nodes = useStore((s) => s.nodes);
  const [stage, setStage] = useState(1);
  const [selectedNodeName, setSelectedNodeName] = useState(null);

  // Only recomputed when nodes array reference changes — not on every local state update
  const namespace = useMemo(() => buildNamespace(nodes), [nodes]);

  // Exclude self — recomputed only when namespace or nodeId changes
  const otherNodes = useMemo(
    () => Object.entries(namespace).filter(([, entry]) => entry.nodeId !== nodeId),
    [namespace, nodeId]
  );

  const handleNodeSelect = useCallback((nodeName) => {
    setSelectedNodeName(nodeName);
    setStage(2);
  }, []);

  const handleVarSelect = useCallback(
    (nodeName, varName) => {
      onInsert(`{{${nodeName}.${varName}}}`);
      // reset
      setStage(1);
      setSelectedNodeName(null);
      onClose();
    },
    [onInsert, onClose]
  );

  const handleBack = useCallback(() => {
    setStage(1);
    setSelectedNodeName(null);
  }, []);

  const handleClose = useCallback(() => {
    setStage(1);
    setSelectedNodeName(null);
    onClose();
  }, [onClose]);

  const selectedEntry = selectedNodeName ? namespace[selectedNodeName] : null;

  return (
    <Popover
      isOpen={isOpen}
      onClose={handleClose}
      placement="bottom-start"
      strategy="fixed"
      closeOnBlur
      isLazy
    >
      <PopoverTrigger>{children}</PopoverTrigger>
      <PopoverContent
        w="220px"
        border="1px solid"
        borderColor="gray.200"
        boxShadow="lg"
        borderRadius="md"
        bg="white"
        _focus={{ outline: 'none' }}
      >
        <PopoverBody p={0}>
          {/* Header */}
          <Flex
            align="center"
            px={3}
            py={2}
            borderBottom="1px solid"
            borderColor="gray.100"
            gap={2}
          >
            {stage === 2 && (
              <Box
                as="button"
                onClick={handleBack}
                color="gray.400"
                _hover={{ color: 'gray.600' }}
                display="flex"
                alignItems="center"
              >
                <Icon as={FiChevronLeft} boxSize={3.5} />
              </Box>
            )}
            <Text fontSize="10px" fontWeight="700" color="gray.500" textTransform="uppercase" letterSpacing="0.08em">
              {stage === 1 ? 'Select Node' : `${selectedNodeName} outputs`}
            </Text>
          </Flex>

          {/* Stage 1: node list */}
          {stage === 1 && (
            <Box maxH="200px" overflowY="auto">
              {otherNodes.length === 0 ? (
                <Text px={3} py={3} fontSize="12px" color="gray.400" textAlign="center">
                  No other nodes available
                </Text>
              ) : (
                otherNodes.map(([nodeName, entry]) => (
                  <Flex
                    key={nodeName}
                    as="button"
                    w="100%"
                    align="center"
                    justify="space-between"
                    px={3}
                    py={2}
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleNodeSelect(nodeName)}
                    cursor="pointer"
                    textAlign="left"
                  >
                    <Box>
                      <Text fontSize="12px" fontWeight="600" color="gray.700" fontFamily="mono">
                        {nodeName}
                      </Text>
                      <Text fontSize="10px" color="gray.400">
                        {NODE_TYPE_LABEL[entry.nodeType] ?? entry.nodeType}
                      </Text>
                    </Box>
                    <Icon as={FiChevronRight} boxSize={3.5} color="gray.400" />
                  </Flex>
                ))
              )}
            </Box>
          )}

          {/* Stage 2: variable list */}
          {stage === 2 && selectedEntry && (
            <Box maxH="200px" overflowY="auto">
              {selectedEntry.outputs.length === 0 ? (
                <Text px={3} py={3} fontSize="12px" color="gray.400" textAlign="center">
                  No outputs
                </Text>
              ) : (
                selectedEntry.outputs.map((out) => (
                  <Flex
                    key={out.varName}
                    as="button"
                    w="100%"
                    align="center"
                    justify="space-between"
                    px={3}
                    py={2}
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleVarSelect(selectedNodeName, out.varName)}
                    cursor="pointer"
                    textAlign="left"
                    gap={2}
                  >
                    <Box flex="1" minW={0}>
                      <Text fontSize="12px" fontWeight="600" color="gray.700" fontFamily="mono" isTruncated>
                        {out.varName}
                      </Text>
                      {out.description && (
                        <Text fontSize="10px" color="gray.400" isTruncated>
                          {out.description}
                        </Text>
                      )}
                    </Box>
                    <TypeBadge type={out.type} />
                  </Flex>
                ))
              )}
            </Box>
          )}
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
