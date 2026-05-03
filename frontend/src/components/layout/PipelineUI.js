import { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, { Controls, Background, MiniMap, MarkerType } from 'reactflow';
import { useShallow } from 'zustand/react/shallow';
import { Box } from '@chakra-ui/react';

import { useStore } from '../../store/index';
import { nodeTypes } from '../../lib/NodeRegistry';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  autoEdges: state.autoEdges,
  cycleEdgeKeys: state.cycleEdgeKeys,
  // getNodeID and addNode are accessed via useStore.getState() inside onDrop
  // to avoid stale closure — no need to subscribe to them here.
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
    autoEdges,
    cycleEdgeKeys,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useStore(useShallow(selector));

  const styledEdges = useMemo(() => {
    // 1. Style real edges (cycle highlight)
    const realStyled = edges.map((e) => {
      const key = `${e.source}>${e.target}`;
      if (cycleEdgeKeys.size === 0 || !cycleEdgeKeys.has(key)) return e;
      return {
        ...e,
        style: { ...(e.style ?? {}), ...CYCLE_EDGE_STYLE },
        className: `${e.className ?? ''} react-flow__edge--cycle`.trim(),
      };
    });

    // 2. Style auto-edges — apply cycle highlight where applicable,
    //    skip any whose source→target pair already has a real edge.
    const realPairs = new Set(edges.map((e) => `${e.source}>${e.target}`));
    const styledAuto = autoEdges
      .filter((ae) => !realPairs.has(`${ae.source}>${ae.target}`))
      .map((ae) => {
        const key = `${ae.source}>${ae.target}`;
        if (cycleEdgeKeys.size > 0 && cycleEdgeKeys.has(key)) {
          return {
            ...ae,
            animated: true,
            markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
            style: { ...(ae.style ?? {}), ...CYCLE_EDGE_STYLE, strokeDasharray: undefined },
            className: `${ae.className ?? ''} react-flow__edge--cycle`.trim(),
          };
        }
        return ae;
      });

    return [...realStyled, ...styledAuto];
  }, [edges, autoEdges, cycleEdgeKeys]);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;

        if (typeof type === 'undefined' || !type) return;

        // project() maps screen coordinates to flow coordinates.
        // screenToFlowPosition() was only added in RF v11.11; we're on v11.8.3.
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Use getState() directly to avoid stale-closure over getNodeID/addNode.
        // Zustand action references are stable, but this is explicit and avoids
        // the eslint-disable comment.
        const { getNodeID: _getNodeID, addNode: _addNode } = useStore.getState();
        const nodeID = _getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: { id: nodeID, nodeType: type },
        };

        _addNode(newNode);
      }
    },
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
