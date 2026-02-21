'use client';

import { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Edge,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
  Panel,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from 'next-themes';

import { StageNode } from './StageNode';
import { NodesSidebar } from './NodesSidebar';
import { NodeInspector } from './NodeInspector';
import { NODE_TEMPLATES, StageData, NODE_CATEGORY_CONFIG } from '@/types';

const nodeTypes = { stage: StageNode };

const INITIAL_NODES: Node<StageData>[] = [
  {
    id: 'awareness',
    type: 'stage',
    position: { x: 80, y: 220 },
    data: {
      title: 'Awareness',
      description: 'Customer discovers your brand through ads, social media, or referrals.',
      category: 'awareness',
      params: { channel: 'Paid social' },
    },
  },
  {
    id: 'interest',
    type: 'stage',
    position: { x: 360, y: 220 },
    data: {
      title: 'Interest',
      description: 'Customer visits your product page and explores key benefits.',
      category: 'interest',
      params: { touchpoint: 'Website' },
    },
  },
  {
    id: 'consideration',
    type: 'stage',
    position: { x: 640, y: 220 },
    data: {
      title: 'Consideration',
      description: 'Customer compares pricing, reviews, and alternatives.',
      category: 'consideration',
      params: { proof: 'Testimonials' },
    },
  },
  {
    id: 'intent',
    type: 'stage',
    position: { x: 920, y: 220 },
    data: {
      title: 'Intent',
      description: 'Customer requests demo or asks final pre-purchase questions.',
      category: 'intent',
      params: { signal: 'Demo request' },
    },
  },
  {
    id: 'purchase',
    type: 'stage',
    position: { x: 1200, y: 220 },
    data: {
      title: 'Purchase',
      description: 'Customer completes checkout and receives confirmation.',
      category: 'purchase',
      params: { conversion: 'Checkout complete' },
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: 'e-awareness-interest', source: 'awareness', target: 'interest', animated: true },
  { id: 'e-interest-consideration', source: 'interest', target: 'consideration', animated: true },
  { id: 'e-consideration-intent', source: 'consideration', target: 'intent', animated: true },
  { id: 'e-intent-purchase', source: 'intent', target: 'purchase', animated: true },
];

let nodeIdCounter = 100;

function FlowEditorInner() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // ── Drag-and-drop from NodesSidebar ────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const templateIdx = e.dataTransfer.getData('application/reactflow-template');
      if (templateIdx === '' || !rfInstance || !reactFlowWrapper.current) return;

      const index = Number.parseInt(templateIdx, 10);
      if (Number.isNaN(index)) return;

      const template = NODE_TEMPLATES[index];
      if (!template) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const newNode: Node<StageData> = {
        id: `node_${++nodeIdCounter}`,
        type: 'stage',
        position,
        data: { ...template.defaultData },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [rfInstance, setNodes]
  );

  // ── Add node button ─────────────────────────────────────────────────────────
  const addDefaultNode = () => {
    const position = { x: 200 + Math.random() * 300, y: 150 + Math.random() * 200 };
    const newNode: Node<StageData> = {
      id: `node_${++nodeIdCounter}`,
      type: 'stage',
      position,
      data: {
        title: 'New Stage',
        description: 'Double-click to edit',
        category: 'awareness',
        params: {},
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
  };

  const edgeStrokeColor = isDark ? '#ffffff35' : '#47556988';
  const dotColor = isDark ? '#ffffff26' : '#33415566';
  const dotSize = isDark ? 1.3 : 1.6;
  const minimapMask = isDark ? '#0a0c1288' : '#e2e8f099';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-[#0a0c12]">
      <NodesSidebar />

      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onInit={setRfInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fitView
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{
            style: { stroke: edgeStrokeColor, strokeWidth: 1.8 },
            animated: true,
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={dotSize}
            color={dotColor}
          />
          <Controls
            className="!border-neutral-300 !bg-white/95 !text-neutral-800 !shadow-none dark:!border-white/10 dark:!bg-[#0f1117] dark:!text-neutral-100"
          />
          <MiniMap
            nodeColor={(n) => {
              const cat = (n.data as StageData)?.category ?? 'consideration';
              return NODE_CATEGORY_CONFIG[cat]?.accent ?? '#666';
            }}
            maskColor={minimapMask}
            className="!overflow-hidden !rounded-xl !border !border-neutral-300 !bg-white/95 dark:!border-white/10 dark:!bg-[#0f1117]"
          />

          {/* Toolbar panel */}
          <Panel position="top-right" className="!mt-12 !mr-2">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white/95 px-3 py-2 shadow-xl dark:border-white/10 dark:bg-[#0f1117]">
              <span className="text-[10px] font-mono text-neutral-500 dark:text-white/30">
                {nodes.length} nodes · {edges.length} edges
              </span>
              <div className="h-4 w-px bg-neutral-300 dark:bg-white/10" />
              <button
                onClick={addDefaultNode}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add stage
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <NodeInspector nodeId={selectedNodeId} />
    </div>
  );
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <FlowEditorInner />
    </ReactFlowProvider>
  );
}
