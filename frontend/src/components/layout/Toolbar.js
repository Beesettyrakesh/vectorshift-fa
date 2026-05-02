import { Flex, Heading } from '@chakra-ui/react';
import { DraggableNode } from './DraggableNode';
import { toolbarEntries } from '../nodes/registry';
import { ValidationStatus } from '../controls/ValidationStatus';
import { RunButton } from '../controls/RunButton';

export const PipelineToolbar = () => (
  <Flex
    as="header"
    align="center"
    gap={4}
    px={5}
    py={3}
    bg="toolbar.bg"
    color="toolbar.fg"
    borderBottom="1px solid"
    borderColor="toolbar.border"
    boxShadow="sm"
  >
    <Heading
      as="h1"
      size="sm"
      fontWeight="600"
      letterSpacing="0.02em"
      mr={4}
    >
      VS Pipeline Builder
    </Heading>
    <Flex align="center" gap={2} wrap="wrap" flex="1">
      {toolbarEntries.map((entry) => (
        <DraggableNode
          key={entry.type}
          type={entry.type}
          label={entry.label}
          icon={entry.icon}
          accentColor={entry.accentColor}
          category={entry.category}
        />
      ))}
    </Flex>
    <Flex align="center" gap={3} flexShrink={0}>
      <ValidationStatus />
      <RunButton />
    </Flex>
  </Flex>
);
