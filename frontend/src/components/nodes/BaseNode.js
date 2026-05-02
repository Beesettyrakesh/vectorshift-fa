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
  VStack,
} from '@chakra-ui/react';
import { useStore } from '../../store/index';

/**
 * @typedef {Object} HandleDef
 * @property {string} name
 * @property {string} [label]
 */

/**
 * @typedef {Object} SelectOption
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {Object} FieldDef
 * @property {string} key
 * @property {string} label
 * @property {'text'|'select'|'number'|'textarea'} type
 * @property {string|number} [defaultValue]
 * @property {SelectOption[]} [options]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [step]
 * @property {string} [placeholder]
 */

/**
 * @typedef {Object} BaseNodeConfig
 * @property {string} title
 * @property {React.ComponentType} [icon]
 * @property {string} accentColor
 * @property {HandleDef[]} inputs
 * @property {HandleDef[]} outputs
 * @property {FieldDef[]} [fields]
 */

const handleTop = (index, total) => `${((index + 1) / (total + 1)) * 100}%`;

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
        <Select
          {...common}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
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
          onChange={(stringValue, numberValue) =>
            onChange(Number.isNaN(numberValue) ? stringValue : numberValue)
          }
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

/**
 * Shared node shell consumed by every node type.
 */
export const BaseNode = ({
  id,
  data = {},
  selected = false,
  config,
  dynamicInputs,
  children,
  containerProps,
}) => {
  const updateNodeField = useStore((state) => state.updateNodeField);
  const isInCycle = useStore((state) => state.cycleNodeIds.has(id));

  const inputs = dynamicInputs ?? config.inputs ?? [];
  const outputs = config.outputs ?? [];
  const fields = config.fields ?? [];
  const IconComponent = config.icon;

  const borderColor = isInCycle ? 'red.400' : selected ? 'brand.500' : 'node.border';
  const borderWidth = isInCycle ? '2px' : '1px';
  const boxShadow = isInCycle
    ? '0 0 0 3px rgba(239, 68, 68, 0.25), 0 4px 12px rgba(239, 68, 68, 0.15)'
    : selected
    ? 'nodeSelected'
    : 'node';

  return (
    <Box
      position="relative"
      minW="220px"
      bg="node.bg"
      borderWidth={borderWidth}
      borderColor={borderColor}
      borderRadius="node"
      boxShadow={boxShadow}
      transition="box-shadow 0.15s ease, border-color 0.15s ease"
      _hover={{
        boxShadow: isInCycle ? boxShadow : selected ? 'nodeSelected' : 'nodeHover',
      }}
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
        {IconComponent ? <Icon as={IconComponent} boxSize={4} /> : null}
        <Heading as="h3" size="xs" fontWeight="600" letterSpacing="0.01em">
          {config.title}
        </Heading>
      </Flex>

      {/* Body */}
      <Box px={5} py={3}>
        {children ? (
          children
        ) : fields.length > 0 ? (
          <VStack align="stretch" spacing={2}>
            {fields.map((field) => {
              const value =
                data[field.key] !== undefined ? data[field.key] : field.defaultValue;
              return (
                <FormControl key={field.key}>
                  <FormLabel fontSize="xs" color="node.textMuted" mb={1} fontWeight="500">
                    {field.label}
                  </FormLabel>
                  {renderField({
                    field,
                    value,
                    onChange: (v) => updateNodeField(id, field.key, v),
                  })}
                </FormControl>
              );
            })}
          </VStack>
        ) : null}
      </Box>

      {/* Input (target) handles on the left */}
      {inputs.map((h, i) => (
        <Handle
          key={`in-${h.name}`}
          type="target"
          position={Position.Left}
          id={`${id}-${h.name}`}
          style={{ top: handleTop(i, inputs.length) }}
        />
      ))}

      {/* Output (source) handles on the right */}
      {outputs.map((h, i) => (
        <Handle
          key={`out-${h.name}`}
          type="source"
          position={Position.Right}
          id={`${id}-${h.name}`}
          style={{ top: handleTop(i, outputs.length) }}
        />
      ))}
    </Box>
  );
};

export default BaseNode;
