'use client';

import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { StageNode, StageEdge } from '@/types';
import {
  applyAutoLayout,
  createNewStageNode,
  exportFlowAsJSON,
  importFlowFromJSON,
} from '@/lib/flowUtils';
import { FlowData } from '@/types';

interface UseFlowActionsProps {
  nodes: StageNode[];
  edges: StageEdge[];
  setNodes: (nodes: StageNode[] | ((prev: StageNode[]) => StageNode[])) => void;
  setEdges: (edges: StageEdge[] | ((prev: StageEdge[]) => StageEdge[])) => void;
}

export function useFlowActions({
  nodes,
  edges,
  setNodes,
  setEdges,
}: UseFlowActionsProps) {
  const { fitView } = useReactFlow();

  const handleAddStage = useCallback(() => {
    const newNode = createNewStageNode();
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = applyAutoLayout(nodes);
    setNodes(layoutedNodes);
  }, [nodes, setNodes]);

  const handleCenterView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  const handleExportJSON = useCallback(() => {
    const data: FlowData = { nodes, edges };
    exportFlowAsJSON(data);
  }, [nodes, edges]);

  const handleImportJSON = useCallback(async () => {
    try {
      const data = await importFlowFromJSON();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (error) {
      console.error('Failed to import JSON:', error);
    }
  }, [setNodes, setEdges]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
  }, [setNodes, setEdges]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  return {
    handleAddStage,
    handleAutoLayout,
    handleCenterView,
    handleExportJSON,
    handleImportJSON,
    handleDeleteNode,
    handleDeleteEdge,
  };
}
