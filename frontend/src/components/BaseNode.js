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
  Text,
  VStack,
} from '@chakra-ui/react';
import { useStore } from '../store';

/**
 * @typedef {Object} HandleDef
 * @property {string} name    Used to build the handle id: `${nodeId}-${name}`
 * @property {string} [label] Optional display label rendered next to the handle
 */

/**
 * @typedef {Object} SelectOption
 * @property {string} label   Display text shown in the dropdown
 * @property {string} value   Value stored in `node.data`
 */

/**
 * @typedef {Object} FieldDef
 * @property {string} key                Data key written to `node.data[key]`
 * @property {string} label              Label displayed above / beside the field
 * @property {'text'|'select'|'number'|'textarea'} type
 * @property {string|number} [defaultValue]
 * @property {SelectOption[]} [options]  Required only when `type === 'select'`
 * @property {number} [min]              Only for `type === 'number'`
 * @property {number} [max]              Only for `type === 'number'`
 * @property {number} [step]             Only for `type === 'number'`
 * @property {string} [placeholder]
 */

/**
 * @typedef {Object} BaseNodeConfig
 * @property {string} title                    Display name in the title bar
 * @property {React.ComponentType} [icon]      `react-icons` component (e.g., FiInbox)
 * @property {string} accentColor              CSS color used for the title bar + left border
 * @property {HandleDef[]} inputs              Input (target) handle defs on the left
 * @property {HandleDef[]} outputs             Output (source) handle defs on the right
 * @property {FieldDef[]} [fields]             Auto-rendered form fields in the body
 */

/**
 * Compute evenly spaced `top` percentages for N handles on one side.
 *
 * For n handles, handle i (0-indexed) is placed at top = ((i+1)/(n+1))*100%.
 * This produces strictly interior positions (never exactly 0% or 100%) and
 * matches the formula defined in design.md §1 "Handle Spacing Formula" and
 * Property 2 in the correctness properties.
 *
 * @param {number} index
 * @param {number} total
 * @returns {string} CSS `top` value (e.g. "33.33%")
 */
const handleTop = (index, total) => `${((index + 1) / (total + 1)) * 100}%`;

/**
 * Render a single body field based on its FieldDef, bound to the zustand store.
 *
 * Kept inline (not a separate component) because it's only used by BaseNode
 * and needs the `id` + `data` + `updateNodeField` closure.
 */
const renderField = ({ id, field, value, onChange }) => {
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
          <NumberInputField
            {...common}
            placeholder={field.placeholder}
          />
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
 *
 * @param {Object} props
 * @param {string} props.id                   ReactFlow node id
 * @param {Object} [props.data]               ReactFlow node data (field values)
 * @param {boolean} [props.selected]          ReactFlow `selected` flag
 * @param {BaseNodeConfig} props.config       Static node configuration
 * @param {HandleDef[]} [props.dynamicInputs] Runtime-computed input handles
 *   (used by TextNode for `{{ variable }}` detection). Rendered alongside
 *   `config.inputs` on the left side; if provided, REPLACES `config.inputs`.
 * @param {React.ReactNode} [props.children]  Custom body content. When
 *   provided, `config.fields` is ignored (children take precedence).
 * @param {Object} [props.containerProps]     Additional Chakra props forwarded
 *   to the outer <Box>. Used by TextNode to override width/height for
 *   auto-resize.
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

  const inputs = dynamicInputs ?? config.inputs ?? [];
  const outputs = config.outputs ?? [];
  const fields = config.fields ?? [];
  const IconComponent = config.icon;

  return (
    <Box
      position="relative"
      minW="220px"
      bg="node.bg"
      borderWidth="1px"
      borderColor={selected ? 'brand.500' : 'node.border'}
      borderRadius="node"
      boxShadow={selected ? 'nodeSelected' : 'node'}
      transition="box-shadow 0.15s ease, border-color 0.15s ease"
      _hover={{ boxShadow: selected ? 'nodeSelected' : 'nodeHover' }}
      overflow="visible"
      {...containerProps}
    >
      {/* ---------- Title bar ---------- */}
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

      {/* ---------- Body ---------- */}
      <Box px={3} py={3}>
        {children ? (
          children
        ) : fields.length > 0 ? (
          <VStack align="stretch" spacing={2}>
            {fields.map((field) => {
              const value =
                data[field.key] !== undefined
                  ? data[field.key]
                  : field.defaultValue;
              return (
                <FormControl key={field.key}>
                  <FormLabel
                    fontSize="xs"
                    color="node.textMuted"
                    mb={1}
                    fontWeight="500"
                  >
                    {field.label}
                  </FormLabel>
                  {renderField({
                    id,
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

      {/* ---------- Input (target) handles on the left ---------- */}
      {inputs.map((h, i) => (
        <Box key={`in-${h.name}`}>
          <Handle
            type="target"
            position={Position.Left}
            id={`${id}-${h.name}`}
            style={{ top: handleTop(i, inputs.length) }}
          />
          {h.label ? (
            <Text
              position="absolute"
              left="12px"
              top={handleTop(i, inputs.length)}
              transform="translateY(-50%)"
              fontSize="xs"
              color="node.textMuted"
              pointerEvents="none"
              bg="node.bg"
              px={1}
            >
              {h.label}
            </Text>
          ) : null}
        </Box>
      ))}

      {/* ---------- Output (source) handles on the right ---------- */}
      {outputs.map((h, i) => (
        <Box key={`out-${h.name}`}>
          <Handle
            type="source"
            position={Position.Right}
            id={`${id}-${h.name}`}
            style={{ top: handleTop(i, outputs.length) }}
          />
          {h.label ? (
            <Text
              position="absolute"
              right="12px"
              top={handleTop(i, outputs.length)}
              transform="translateY(-50%)"
              fontSize="xs"
              color="node.textMuted"
              pointerEvents="none"
              bg="node.bg"
              px={1}
            >
              {h.label}
            </Text>
          ) : null}
        </Box>
      ))}
    </Box>
  );
};

export default BaseNode;
