import { Flex, Icon, Text } from '@chakra-ui/react';

export const DraggableNode = ({ type, label, icon, accentColor, category }) => {
  const onDragStart = (event) => {
    const appData = { nodeType: type };
    event.target.style.cursor = 'grabbing';
    event.dataTransfer.setData('application/reactflow', JSON.stringify(appData));
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
