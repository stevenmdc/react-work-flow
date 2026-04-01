"use client";

// components/flow/FlowEditor.tsx
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  ConnectionMode,
  addEdge,
  reconnectEdge,
  useNodesState,
  useEdgesState,
  type Edge,
  Connection,
  BackgroundVariant,
  ReactFlowProvider,
  ReactFlowInstance,
  Panel,
  Node,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTheme } from "next-themes";

import { StageNode } from "./StageNode";
import { NodeInspector } from "./NodeInspector";
import { GlowStepEdge } from "./GlowStepEdge";
import { SketchEdge } from "./SketchEdge";
import { NODE_TEMPLATES, StageData, NODE_CATEGORY_CONFIG } from "@/types";
import { getDefaultStageIcon } from "@/lib/stageIcons";

const NODE_TYPES = { stage: StageNode };
const EDGE_TYPES = { glow: GlowStepEdge, sketch: SketchEdge };
type FlowBackgroundMode = "dots" | "grid";
type ConnectorMode = "glow" | "sketch";
type AutoHandleIds = {
  sourceHandle: string;
  targetHandle: string;
};
type RandomStageAppearance = NonNullable<StageData["appearance"]>;
type EdgeBundleOffsets = {
  sourceOffset: number;
  targetOffset: number;
};

const INITIAL_NODES: Node<StageData>[] = [
  {
    id: "awareness",
    type: "stage",
    position: { x: 80, y: 220 },
    data: {
      title: "Awareness",
      description:
        "Customer discovers your brand through ads, social media, or referrals.",
      category: "awareness",
      icon: "Megaphone",
      params: { channel: "Paid social" },
      badges: ["Top funnel"],
    },
  },
  {
    id: "interest",
    type: "stage",
    position: { x: 360, y: 220 },
    data: {
      title: "Interest",
      description:
        "Customer visits your product page and explores key benefits.",
      category: "interest",
      icon: "Search",
      params: { touchpoint: "Website" },
      badges: ["Engagement"],
    },
  },
  {
    id: "consideration",
    type: "stage",
    position: { x: 640, y: 220 },
    data: {
      title: "Consideration",
      description: "Customer compares pricing, reviews, and alternatives.",
      category: "consideration",
      icon: "Scale",
      params: { proof: "Testimonials" },
      badges: ["Evaluation"],
    },
  },
  {
    id: "intent",
    type: "stage",
    position: { x: 920, y: 220 },
    data: {
      title: "Intent",
      description:
        "Customer requests demo or asks final pre-purchase questions.",
      category: "intent",
      icon: "Target",
      params: { signal: "Demo request" },
      badges: ["High intent"],
    },
  },
  {
    id: "purchase",
    type: "stage",
    position: { x: 1200, y: 220 },
    data: {
      title: "Purchase",
      description: "Customer completes checkout and receives confirmation.",
      category: "purchase",
      icon: "ShoppingCart",
      params: { conversion: "Checkout complete" },
      badges: ["Conversion"],
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  {
    id: "e-awareness-interest",
    source: "awareness",
    target: "interest",
    type: "glow",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "e-interest-consideration",
    source: "interest",
    target: "consideration",
    type: "glow",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "e-consideration-intent",
    source: "consideration",
    target: "intent",
    type: "glow",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "e-intent-purchase",
    source: "intent",
    target: "purchase",
    type: "glow",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];

let nodeIdCounter = 100;
const emptySubscribe = () => () => {};
const RANDOM_STAGE_APPEARANCES: RandomStageAppearance[] = [
  { backgroundColor: "#38bdf8", contentColor: "black" },
  { backgroundColor: "#fda4af", contentColor: "black" },
  { backgroundColor: "#facc15", contentColor: "black" },
  { backgroundColor: "#34d399", contentColor: "black" },
  { backgroundColor: "#a78bfa", contentColor: "black" },
  { backgroundColor: "#fb7185", contentColor: "black" },
  { backgroundColor: "#2dd4bf", contentColor: "black" },
  { backgroundColor: "#f97316", contentColor: "black" },
];

function getRandomStageAppearance() {
  return RANDOM_STAGE_APPEARANCES[
    Math.floor(Math.random() * RANDOM_STAGE_APPEARANCES.length)
  ];
}

function getAutoHandleIds(
  sourceNode: Node<StageData>,
  targetNode: Node<StageData>,
): AutoHandleIds {
  const sourceX = sourceNode.position.x;
  const sourceY = sourceNode.position.y;
  const targetX = targetNode.position.x;
  const targetY = targetNode.position.y;
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;

  if (Math.abs(deltaX) >= Math.abs(deltaY)) {
    return deltaX >= 0
      ? { sourceHandle: "handle-right", targetHandle: "handle-left" }
      : { sourceHandle: "handle-left", targetHandle: "handle-right" };
  }

  return deltaY >= 0
    ? { sourceHandle: "handle-bottom", targetHandle: "handle-top" }
    : { sourceHandle: "handle-top", targetHandle: "handle-bottom" };
}

function getHandleAxis(handleId?: string | null) {
  if (handleId?.includes("top") || handleId?.includes("bottom")) {
    return "x";
  }

  return "y";
}

function getNodeAxisValue(node: Node<StageData> | undefined, axis: "x" | "y") {
  return axis === "x" ? node?.position.x ?? 0 : node?.position.y ?? 0;
}

function createBundleOffsets(edgeIds: string[], spacing = 14) {
  const centered = new Map<string, number>();
  const centerIndex = (edgeIds.length - 1) / 2;

  edgeIds.forEach((edgeId, index) => {
    centered.set(edgeId, (index - centerIndex) * spacing);
  });

  return centered;
}

function getEdgeBundleOffsets(
  edges: Edge[],
  nodes: Node<StageData>[],
): Record<string, EdgeBundleOffsets> {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const sourceGroups = new Map<string, { edgeId: string; sortValue: number }[]>();
  const targetGroups = new Map<string, { edgeId: string; sortValue: number }[]>();

  edges.forEach((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    const sourceKey = `${edge.source}:${edge.sourceHandle ?? "auto"}`;
    const targetKey = `${edge.target}:${edge.targetHandle ?? "auto"}`;
    const sourceAxis = getHandleAxis(edge.sourceHandle);
    const targetAxis = getHandleAxis(edge.targetHandle);
    const sourceGroup = sourceGroups.get(sourceKey) ?? [];
    const targetGroup = targetGroups.get(targetKey) ?? [];

    sourceGroup.push({
      edgeId: edge.id,
      sortValue: getNodeAxisValue(targetNode, sourceAxis),
    });
    targetGroup.push({
      edgeId: edge.id,
      sortValue: getNodeAxisValue(sourceNode, targetAxis),
    });

    sourceGroups.set(sourceKey, sourceGroup);
    targetGroups.set(targetKey, targetGroup);
  });

  const sourceOffsets = new Map<string, number>();
  const targetOffsets = new Map<string, number>();

  sourceGroups.forEach((group) => {
    const sortedIds = [...group]
      .sort((a, b) => a.sortValue - b.sortValue || a.edgeId.localeCompare(b.edgeId))
      .map((entry) => entry.edgeId);
    const offsets = createBundleOffsets(sortedIds);

    offsets.forEach((offset, edgeId) => {
      sourceOffsets.set(edgeId, offset);
    });
  });

  targetGroups.forEach((group) => {
    const sortedIds = [...group]
      .sort((a, b) => a.sortValue - b.sortValue || a.edgeId.localeCompare(b.edgeId))
      .map((entry) => entry.edgeId);
    const offsets = createBundleOffsets(sortedIds);

    offsets.forEach((offset, edgeId) => {
      targetOffsets.set(edgeId, offset);
    });
  });

  return Object.fromEntries(
    edges.map((edge) => [
      edge.id,
      {
        sourceOffset: sourceOffsets.get(edge.id) ?? 0,
        targetOffset: targetOffsets.get(edge.id) ?? 0,
      },
    ]),
  );
}

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

function FlowEditorInner() {
  const { resolvedTheme } = useTheme();
  const mounted = useIsMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [backgroundMode, setBackgroundMode] =
    useState<FlowBackgroundMode>("dots");
  const [connectorMode, setConnectorMode] = useState<ConnectorMode>("glow");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const edgeTypes = useMemo(() => EDGE_TYPES, []);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);
      const inferredHandles =
        sourceNode && targetNode
          ? getAutoHandleIds(sourceNode, targetNode)
          : undefined;
      const connection: Connection = {
        source: params.source,
        target: params.target,
        sourceHandle:
          params.sourceHandle ?? inferredHandles?.sourceHandle ?? null,
        targetHandle:
          params.targetHandle ?? inferredHandles?.targetHandle ?? null,
      };

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: connectorMode,
            animated: false,
            updatable: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds,
        ),
      );
    },
    [connectorMode, nodes, setEdges],
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (!newConnection.source || !newConnection.target) return;

      const sourceNode = nodes.find((node) => node.id === newConnection.source);
      const targetNode = nodes.find((node) => node.id === newConnection.target);
      const inferredHandles =
        sourceNode && targetNode
          ? getAutoHandleIds(sourceNode, targetNode)
          : undefined;
      const connection: Connection = {
        source: newConnection.source,
        target: newConnection.target,
        sourceHandle:
          newConnection.sourceHandle ?? inferredHandles?.sourceHandle ?? null,
        targetHandle:
          newConnection.targetHandle ?? inferredHandles?.targetHandle ?? null,
      };

      setEdges((eds) =>
        reconnectEdge(
          oldEdge,
          connection,
          eds,
        ),
      );
      setSelectedEdgeId(oldEdge.id);
    },
    [nodes, setEdges],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
  }, []);

  const onEdgeMouseEnter = useCallback((_: React.MouseEvent, edge: Edge) => {
    setHoveredEdgeId(edge.id);
  }, []);

  const onEdgeMouseLeave = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setHoveredEdgeId((prev) => (prev === edge.id ? null : prev));
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHoveredEdgeId(null);
  }, []);

  const deleteEdgeById = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId((prev) => (prev === edgeId ? null : prev));
      setHoveredEdgeId((prev) => (prev === edgeId ? null : prev));
    },
    [setEdges],
  );

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    deleteEdgeById(selectedEdgeId);
  }, [deleteEdgeById, selectedEdgeId]);

  const reverseEdgeDirection = useCallback(
    (edgeId: string) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.id !== edgeId) return edge;

          const sourceNode = nodes.find((node) => node.id === edge.target);
          const targetNode = nodes.find((node) => node.id === edge.source);
          const inferredHandles =
            sourceNode && targetNode
              ? getAutoHandleIds(sourceNode, targetNode)
              : undefined;

          return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: inferredHandles?.sourceHandle ?? edge.targetHandle,
            targetHandle: inferredHandles?.targetHandle ?? edge.sourceHandle,
          };
        }),
      );
      setSelectedEdgeId(edgeId);
      setHoveredEdgeId(edgeId);
    },
    [nodes, setEdges],
  );

  const handleNodeDeleted = useCallback((deletedId: string) => {
    setSelectedNodeId((prev) => (prev === deletedId ? null : prev));
    setSelectedEdgeId(null);
  }, []);

  // ── Drag-and-drop from NodesSidebar ────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const templateIdx = e.dataTransfer.getData(
        "application/reactflow-template",
      );
      if (templateIdx === "" || !rfInstance || !reactFlowWrapper.current)
        return;

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
        type: "stage",
        position,
        data: { ...template.defaultData },
      };

      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [rfInstance, setNodes],
  );

  // ── Add node button ─────────────────────────────────────────────────────────
  const addDefaultNode = () => {
    const appearance = getRandomStageAppearance();
    const position = {
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
    };
    const newNode: Node<StageData> = {
      id: `node_${++nodeIdCounter}`,
      type: "stage",
      position,
      data: {
        title: "New Stage",
        description: "Double-click to edit",
        category: "awareness",
        icon: getDefaultStageIcon("awareness"),
        params: {},
        badges: [],
        appearance,
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
  };

  const edgeStrokeColor = isDark ? "#e2e8f080" : "#334155b3";
  const beamColor = isDark ? "#c084fc" : "#9333ea";
  const edgeStrokeWidth = connectorMode === "sketch" ? 2.9 : 1.8;
  const connectionLineType =
    connectorMode === "sketch"
      ? ConnectionLineType.Bezier
      : ConnectionLineType.Step;
  const resolvedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);
        const inferredHandles =
          sourceNode && targetNode
            ? getAutoHandleIds(sourceNode, targetNode)
            : undefined;

        return {
          ...edge,
          sourceHandle: edge.sourceHandle ?? inferredHandles?.sourceHandle,
          targetHandle: edge.targetHandle ?? inferredHandles?.targetHandle,
        };
      }),
    [edges, nodes],
  );
  const edgeBundleOffsets = useMemo(
    () => getEdgeBundleOffsets(resolvedEdges, nodes),
    [resolvedEdges, nodes],
  );
  const themedEdges = useMemo(
    () =>
      resolvedEdges.map((edge) => {
        const bundleOffsets = edgeBundleOffsets[edge.id] ?? {
          sourceOffset: 0,
          targetOffset: 0,
        };

        return {
          ...edge,
          type: connectorMode,
          animated: false,
          data: {
            ...edge.data,
            beamColor,
            isInteractive:
              hoveredEdgeId === edge.id || selectedEdgeId === edge.id,
            onDelete: () => deleteEdgeById(edge.id),
            onReverse: () => reverseEdgeDirection(edge.id),
            sourceBundleOffset: bundleOffsets.sourceOffset,
            targetBundleOffset: bundleOffsets.targetOffset,
          },
          style: {
            ...edge.style,
            stroke: edgeStrokeColor,
            strokeWidth: edge.style?.strokeWidth ?? edgeStrokeWidth,
            strokeDasharray: "none",
          },
          markerEnd: edge.markerEnd ?? { type: MarkerType.ArrowClosed },
        };
      }),
    [
      beamColor,
      connectorMode,
      deleteEdgeById,
      edgeBundleOffsets,
      edgeStrokeColor,
      edgeStrokeWidth,
      hoveredEdgeId,
      reverseEdgeDirection,
      resolvedEdges,
      selectedEdgeId,
    ],
  );
  const backgroundColor =
    backgroundMode === "dots"
      ? isDark
        ? "#ffffff22"
        : "#47556938"
      : isDark
        ? "#ffffff14"
        : "#94a3b824";
  const backgroundVariant =
    backgroundMode === "dots"
      ? BackgroundVariant.Dots
      : BackgroundVariant.Lines;
  const backgroundGap = backgroundMode === "dots" ? 30 : 48;
  const backgroundSize =
    backgroundMode === "dots" ? (isDark ? 1.1 : 1.3) : 0.85;
  const minimapMask = isDark ? "#0a0c1288" : "#e2e8f099";
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId)
    : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-[#0a0c12]">
      <NodeInspector
        nodeId={selectedNodeId}
        nodes={nodes}
        setNodes={setNodes}
        setEdges={setEdges}
        onNodeDeleted={handleNodeDeleted}
        onNodeDuplicated={(duplicatedId) => {
          setSelectedNodeId(duplicatedId);
          setSelectedEdgeId(null);
        }}
      />

      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={themedEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onEdgeMouseEnter={onEdgeMouseEnter}
          onEdgeMouseLeave={onEdgeMouseLeave}
          onPaneClick={onPaneClick}
          onInit={setRfInstance}
          onDragOver={onDragOver}
          onDrop={onDrop}
          edgesUpdatable
          deleteKeyCode={["Delete"]}
          elevateEdgesOnSelect
          fitView
          proOptions={{ hideAttribution: false }}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: connectorMode,
            style: { stroke: edgeStrokeColor, strokeWidth: edgeStrokeWidth },
            animated: false,
            updatable: true,
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
          connectionLineType={connectionLineType}
          connectionLineStyle={{
            stroke: edgeStrokeColor,
            strokeWidth: edgeStrokeWidth,
          }}
        >
          <Background
            variant={backgroundVariant}
            gap={backgroundGap}
            size={backgroundSize}
            color={backgroundColor}
          />
          <Controls className="!border-neutral-300 !bg-white/95 !text-neutral-800 !shadow-none dark:!border-white/10 dark:!bg-[#0f1117] dark:!text-neutral-100" />
          <MiniMap
            nodeColor={(n) => {
              const cat = (n.data as StageData)?.category ?? "consideration";
              return NODE_CATEGORY_CONFIG[cat]?.accent ?? "#666";
            }}
            maskColor={minimapMask}
            className="!overflow-hidden !rounded-xl !border !border-neutral-300 !bg-white/95 dark:!border-white/10 dark:!bg-[#0f1117]"
          />

          {/* Toolbar panel */}
          <Panel
            position="top-left"
            className="!left-1/2 !top-4 !mt-0 !ml-0 !-translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white/95 px-3 py-2 shadow-xl dark:border-white/10 dark:bg-[#0f1117]">
              <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-white/5">
                <button
                  onClick={() => setBackgroundMode("dots")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    backgroundMode === "dots"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white/12 dark:text-white"
                      : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  Dots
                </button>
                <button
                  onClick={() => setBackgroundMode("grid")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    backgroundMode === "grid"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white/12 dark:text-white"
                      : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  Grid
                </button>
              </div>
              <div className="h-4 w-px bg-neutral-300 dark:bg-white/10" />
              <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-white/5">
                <button
                  onClick={() => setConnectorMode("glow")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    connectorMode === "glow"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white/12 dark:text-white"
                      : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  Glow
                </button>
                <button
                  onClick={() => setConnectorMode("sketch")}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    connectorMode === "sketch"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-white/12 dark:text-white"
                      : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900 dark:text-white/45 dark:hover:bg-white/8 dark:hover:text-white"
                  }`}
                >
                  Sketch
                </button>
              </div>
              <div className="h-4 w-px bg-neutral-300 dark:bg-white/10" />
              <button
                onClick={addDefaultNode}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-white/60 dark:hover:bg-white/8 dark:hover:text-white"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add stage
              </button>
            </div>
          </Panel>

          {selectedEdge && (
            <Panel position="top-right" className="!mt-28 !mr-2">
              <div className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white/95 px-3 py-2 shadow-xl dark:border-white/10 dark:bg-[#0f1117]">
                <span className="text-[10px] font-mono text-neutral-500 dark:text-white/30">
                  Link selected
                </span>
                <div className="h-4 w-px bg-neutral-300 dark:bg-white/10" />
                <button
                  onClick={deleteSelectedEdge}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/15 dark:text-red-400 dark:hover:bg-red-500/20"
                >
                  Delete link
                </button>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
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
