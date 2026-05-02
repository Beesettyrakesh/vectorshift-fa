// components/nodes/OutputsPanel.js
//
// Collapsible outputs panel. Default: collapsed (hidden).
// The outer Box always has overflow=VISIBLE so handles at right=-6px are never clipped.
// An inner "clip" Box does the width animation so content hides during collapse.

import { Box, Flex, Text, Divider, Icon } from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { Handle, Position } from 'reactflow';

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
      py={0}
      fontSize="9px"
      fontWeight="600"
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

/**
 * @param {string}   nodeId
 * @param {Array}    outputs        [{varName, type, description}]
 * @param {boolean}  collapsed
 * @param {Function} onToggle
 * @param {number}   [outputHandleCount]  How many rows get a ReactFlow handle.
 *                                        Defaults to outputs.length (all rows).
 *                                        Handles are spaced using this count so
 *                                        1 handle → 50% (center), 2 → 33%/67%, etc.
 */
export const OutputsPanel = ({ nodeId, outputs, collapsed, onToggle, outputHandleCount }) => {
  if (!outputs || outputs.length === 0) return null;

  const PANEL_W = 170; // px

  return (
    // Outer Box: position=relative, overflow=VISIBLE — handles are never clipped
    <Box
      position="relative"
      flexShrink={0}
      // Reserve space so the node doesn't jump; handles sit at right=-6px outside this
      w={collapsed ? '0px' : `${PANEL_W}px`}
      transition="width 0.18s ease"
      overflow="visible"   // ← KEY: never clip handles
    >
      {/* Inner clip box — only this clips the content during animation */}
      <Box
        position="absolute"
        top={0}
        left={0}
        h="100%"
        w={collapsed ? '0px' : `${PANEL_W}px`}
        overflow="hidden"
        transition="width 0.18s ease"
        bg="gray.50"
        borderLeft={collapsed ? 'none' : '1px solid'}
        borderColor="gray.100"
        borderBottomRightRadius="node"
      >
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          px={2}
          py={1.5}
          borderBottom="1px solid"
          borderColor="gray.100"
          minW={`${PANEL_W}px`}
        >
          <Text
            fontSize="10px"
            fontWeight="700"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="0.08em"
            whiteSpace="nowrap"
          >
            Outputs
          </Text>
          <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="18px"
            h="18px"
            borderRadius="sm"
            color="gray.400"
            _hover={{ color: 'gray.600', bg: 'gray.200' }}
            onClick={onToggle}
            cursor="pointer"
            flexShrink={0}
          >
            <Icon as={FiChevronLeft} boxSize={3} />
          </Box>
        </Flex>

        {/* Output rows */}
        {outputs.map((out, i) => (
          <Box key={out.varName} minW={`${PANEL_W}px`}>
            {i > 0 && <Divider borderColor="gray.100" />}
            <Flex
              align="flex-start"
              justify="space-between"
              px={3}
              py={2}
              gap={1.5}
              _hover={{ bg: 'gray.100' }}
              transition="background-color 0.1s"
            >
              <Box flex="1" minW={0}>
                <Text fontSize="11px" fontWeight="600" color="gray.700" isTruncated>
                  {out.varName}
                </Text>
                {out.description && (
                  <Text fontSize="10px" color="gray.400" isTruncated title={out.description} lineHeight="1.3">
                    {out.description}
                  </Text>
                )}
              </Box>
              <TypeBadge type={out.type} />
            </Flex>
          </Box>
        ))}
      </Box>

      {/* Handles — only first handleCount rows get a dot, spaced by handleCount */}
      {(() => {
        const hCount = outputHandleCount ?? outputs.length;
        return outputs.slice(0, hCount).map((out, i) => (
          <Handle
            key={out.varName}
            type="source"
            position={Position.Right}
            id={`${nodeId}-${out.varName}`}
            style={{
              position: 'absolute',
              right: '-6px',
              top: collapsed
                ? '50%'
                : `${((i + 1) / (hCount + 1)) * 100}%`,
              transform: 'translateY(-50%)',
              transition: 'top 0.18s ease',
            }}
          />
        ));
      })()}
    </Box>
  );
};
