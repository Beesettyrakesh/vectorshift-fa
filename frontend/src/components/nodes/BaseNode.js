import { useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Box,
  Flex,
  Heading,
  Icon,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  FormControl,
  FormLabel,
  FormErrorMessage,
  VStack,
} from '@chakra-ui/react';
import { FiChevronRight } from 'react-icons/fi';
import { useStore } from '../../store/index';
import { isValidIdentifier } from '../../lib/variableNamespace';
import { OutputsPanel } from './OutputsPanel';

// ── Handle positioning ────────────────────────────────────────────────────────
const handleTop = (index, total) => `${((index + 1) / (total + 1)) * 100}%`;

// ── Field renderers ───────────────────────────────────────────────────────────
const renderField = ({ field, value, onChange }) => {
  const common = {
    size: 'sm',
    bg: 'white',
    borderColor: 'gray.200',
    _hover: { borderColor: 'gray.300' },
    _focus: { borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' },
  };

  switch (field.type) {
    case 'select':
      return (
        <Select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      );
    case 'number':
      return (
        <NumberInput
          size="sm"
          value={value ?? ''}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onChange={(sv, nv) => onChange(Number.isNaN(nv) ? sv : nv)}
        >
          <NumberInputField {...common} placeholder={field.placeholder} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    case 'textarea':
      return (
        <Textarea
          {...common}
          rows={3}
          resize="vertical"
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'text':
    default:
      return (
        <Input
          {...common}
          type="text"
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

// ── Name field ────────────────────────────────────────────────────────────────
const NameField = ({ nodeId, currentName, renameNode }) => {
  const [draft, setDraft] = useState(currentName ?? '');
  const [error, setError] = useState('');
  const prevNameRef = useRef(currentName ?? '');

  if (currentName !== prevNameRef.current && draft === prevNameRef.current) {
    setDraft(currentName ?? '');
    prevNameRef.current = currentName ?? '';
  }

  const onBlur = () => {
    const trimmed = draft.trim();
    if (trimmed === prevNameRef.current) { setError(''); return; }
    if (!trimmed) { setError('Name cannot be empty'); setDraft(prevNameRef.current); return; }
    if (!isValidIdentifier(trimmed)) { setError('Letters, digits, underscores only; no leading digit'); return; }
    setError('');
    renameNode(nodeId, prevNameRef.current, trimmed);
    prevNameRef.current = trimmed;
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') { setDraft(prevNameRef.current); setError(''); e.target.blur(); }
  };

  return (
    <FormControl isInvalid={!!error} mb={2} minH="58px">
      <FormLabel fontSize="xs" color="node.textMuted" mb={0.5} fontWeight="500">
        Name
      </FormLabel>
      <Input
        size="sm"
        bg="white"
        borderColor="gray.200"
        fontFamily="mono"
        fontSize="xs"
        value={draft}
        onChange={(e) => { setDraft(e.target.value); if (error) setError(''); }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="node_name"
        _hover={{ borderColor: 'gray.300' }}
        _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px #6366f1' }}
      />
      {error && (
        <FormErrorMessage fontSize="10px" mt={0.5} lineHeight="1.3">
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
};

// ── BaseNode ──────────────────────────────────────────────────────────────────
export const BaseNode = ({
  id,
  data = {},
  selected = false,
  config,
  dynamicInputs,
  outputVars,
  outputHandleCount,
  children,
  containerProps,
}) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const renameNode = useStore((s) => s.renameNode);
  const isInCycle = useStore((s) => s.cycleNodeIds.has(id));

  // Outputs panel collapsed state — default TRUE (hidden)
  const [outputsCollapsed, setOutputsCollapsed] = useState(true);

  const inputs = dynamicInputs ?? config.inputs ?? [];
  const legacyOutputs = outputVars ? [] : (config.outputs ?? []);
  const fields = config.fields ?? [];
  const IconComponent = config.icon;
  const hasOutputVars = outputVars && outputVars.length > 0;

  const borderColor = isInCycle ? 'red.400' : selected ? 'brand.500' : 'node.border';
  const borderWidth = isInCycle ? '2px' : '1px';
  const boxShadow = isInCycle
    ? '0 0 0 3px rgba(239,68,68,0.25), 0 4px 12px rgba(239,68,68,0.15)'
    : selected ? 'nodeSelected' : 'node';

  return (
    // Outer wrapper: position=relative, overflow=visible so the panel can slide out
    <Box position="relative" display="inline-flex" alignItems="stretch" overflow="visible">
      {/* ── Main node card ───────────────────────────────────────────── */}
      <Box
        position="relative"
        minW="220px"
        bg="node.bg"
        borderWidth={borderWidth}
        borderColor={borderColor}
        borderRadius="node"
        boxShadow={boxShadow}
        transition="box-shadow 0.15s ease, border-color 0.15s ease"
        _hover={{ boxShadow: isInCycle ? boxShadow : selected ? 'nodeSelected' : 'nodeHover' }}
        overflow="visible"
        {...containerProps}
      >
        {/* Title bar */}
        <Flex
          align="center"
          gap={2}
          px={3}
          py={2}
          bg={config.accentColor}
          color="node.titleFg"
          borderTopRadius="node"
        >
          {IconComponent && <Icon as={IconComponent} boxSize={4} />}
          <Heading as="h3" size="xs" fontWeight="600" letterSpacing="0.01em">
            {config.title}
          </Heading>
        </Flex>

        {/* Body */}
        <Box px={4} py={3} minW={0} overflow="hidden">
          <NameField nodeId={id} currentName={data.nodeName ?? ''} renameNode={renameNode} />

          {children ? children : fields.length > 0 ? (
            <VStack align="stretch" spacing={2}>
              {fields.map((field) => {
                const value = data[field.key] !== undefined ? data[field.key] : field.defaultValue;
                return (
                  <FormControl key={field.key}>
                    <FormLabel fontSize="xs" color="node.textMuted" mb={1} fontWeight="500">
                      {field.label}
                    </FormLabel>
                    {renderField({ field, value, onChange: (v) => updateNodeField(id, field.key, v) })}
                  </FormControl>
                );
              })}
            </VStack>
          ) : null}
        </Box>

        {/* Input handles */}
        {inputs.map((h, i) => (
          <Handle
            key={`in-${h.name}`}
            type="target"
            position={Position.Left}
            id={`${id}-${h.name}`}
            style={{ top: handleTop(i, inputs.length) }}
          />
        ))}

        {/* Legacy output handles (nodes without outputVars) */}
        {legacyOutputs.map((h, i) => (
          <Handle
            key={`out-${h.name}`}
            type="source"
            position={Position.Right}
            id={`${id}-${h.name}`}
            style={{ top: handleTop(i, legacyOutputs.length) }}
          />
        ))}

        {/* ── Expand tab on right border — top-anchored so it never covers the handle dot ── */}
        {hasOutputVars && outputsCollapsed && (
          <Box
            as="button"
            position="absolute"
            right="-14px"
            top="8px"
            transform="none"
            zIndex={10}
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="14px"
            h="32px"
            bg="gray.100"
            borderWidth="1px"
            borderColor="gray.200"
            borderLeftWidth="0"
            borderRightRadius="md"
            color="gray.500"
            _hover={{ bg: 'gray.200', color: 'gray.700' }}
            transition="background 0.1s"
            onClick={() => setOutputsCollapsed(false)}
            title="Show outputs"
          >
            <Icon as={FiChevronRight} boxSize="10px" />
          </Box>
        )}
      </Box>

      {/* ── Outputs panel (slides out to the right) ─────────────────────── */}
      {hasOutputVars && (
        <OutputsPanel
          nodeId={id}
          outputs={outputVars}
          collapsed={outputsCollapsed}
          onToggle={() => setOutputsCollapsed(true)}
          outputHandleCount={outputHandleCount}
        />
      )}
    </Box>
  );
};

export default BaseNode;
