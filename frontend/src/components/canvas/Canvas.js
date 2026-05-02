import { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { shallow } from 'zustand/shallow';
import { Box } from '@chakra-ui/react';

import { useStore } from '../../store/index';
import { nodeTypes } from '../nodes/registry';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  cycleEdgeKeys: state.cycleEdgeKeys,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
});

const CYCLE_EDGE_STYLE = { stroke: '#ef4444', strokeWidth: 2.5 };

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const {
    nodes,
    edges,
    cycleEdgeKeys,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useStore(selector, shallow);

  const styledEdges = useMemo(() => {
    if (cycleEdgeKeys.size === 0) return edges;
    return edges.map((e) => {
      const key = `${e.source}>${e.target}`;
      if (!cycleEdgeKeys.has(key)) return e;
      return {
        ...e,
        style: { ...(e.style ?? {}), ...CYCLE_EDGE_STYLE },
        className: `${e.className ?? ''} react-flow__edge--cycle`.trim(),
      };
    });
  }, [edges, cycleEdgeKeys]);

  const getInitNodeData = (nodeID, type) => ({ id: nodeID, nodeType: type });

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;

        if (typeof type === 'undefined' || !type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        addNode(newNode);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <Box
      ref={reactFlowWrapper}
      w="100%"
      h="calc(100vh - 64px)"
      minH="500px"
      bg="canvas.bg"
      position="relative"
    >
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        connectionLineType="smoothstep"
      >
        <Background color="#CBD5E1" gap={gridSize} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </Box>
  );
};
