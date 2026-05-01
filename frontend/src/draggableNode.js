// draggableNode.js
//
// A single draggable chip in the Toolbar. When dragged and dropped onto the
// Canvas (ui.js), it writes the node type string into the HTML5 drag
// dataTransfer payload so the drop handler can create the right node.
//
// Shape of the dataTransfer payload (unchanged from the original
// implementation — preserves compatibility with ui.js):
//   application/reactflow → JSON.stringify({ nodeType: <type> })

import { Flex, Icon, Text } from '@chakra-ui/react';

/**
 * @param {Object} props
 * @param {string} props.type                 ReactFlow node type key (must
 *   match a `nodeRegistry` key, e.g. "customInput", "llm")
 * @param {string} props.label                Human-readable label shown on
 *   the chip
 * @param {React.ComponentType} [props.icon]  `react-icons` component
 * @param {string} [props.accentColor]        Hex color rendered as the left
 *   border stripe — matches the eventual node's title bar color
 * @param {string} [props.category]           Logical grouping (unused for
 *   now, but forwarded for future filter/search features)
 */
export const DraggableNode = ({ type, label, icon, accentColor, category }) => {
  const onDragStart = (event) => {
    const appData = { nodeType: type };
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify(appData),
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragEnd = (event) => {
    event.target.style.cursor = 'grab';
  };

  return (
    <Flex
      className={type}
      data-category={category}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      draggable
      align="center"
      gap={2}
      px={3}
      py={2}
      minW="100px"
      bg="gray.700"
      color="toolbar.fg"
      borderRadius="md"
      borderLeftWidth="3px"
      borderLeftColor={accentColor ?? 'whiteAlpha.400'}
      cursor="grab"
      userSelect="none"
      transition="background-color 0.15s ease, transform 0.15s ease"
      _hover={{ bg: 'gray.600', transform: 'translateY(-1px)' }}
      _active={{ cursor: 'grabbing', transform: 'translateY(0)' }}
    >
      {icon ? <Icon as={icon} boxSize={4} /> : null}
      <Text fontSize="sm" fontWeight="500">
        {label}
      </Text>
    </Flex>
  );
};
