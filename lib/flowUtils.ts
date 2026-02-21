import { Connection } from 'reactflow';
import { StageNode, StageEdge, FlowData } from '@/types';
import { COLORS } from './constants';

/**
 * Check if a connection already exists between two nodes
 */
export const connectionExists = (
  edges: StageEdge[],
  connection: Connection
): boolean => {
  return edges.some(
    (e) => e.source === connection.source && e.target === connection.target
  );
};

/**
 * Create a new edge with styled properties
 */
export const createStyledEdge = (connection: Connection): StageEdge => ({
  ...connection,
  id: `${connection.source}-${connection.target}-${Date.now()}`,
  animated: true,
  style: { stroke: COLORS.primary, strokeWidth: 2 },
  markerEnd: 'arrowclosed',
} as StageEdge);

/**
 * Create a new stage node
 */
export const createNewStageNode = (): StageNode => {
  const newId = `stage-${Date.now()}`;
  return {
    id: newId,
    data: {
      title: 'New stage',
      description: 'Describe what the customer does here.',
      category: 'consideration',
      params: {},
    },
    position: { x: Math.random() * 500, y: Math.random() * 500 },
    type: 'stageNode',
  };
};

/**
 * Apply auto layout to nodes
 */
export const applyAutoLayout = (nodes: StageNode[]): StageNode[] => {
  return nodes.map((node, index) => ({
    ...node,
    position: { x: index * 320, y: 100 },
  }));
};

/**
 * Export flow data as JSON file
 */
export const exportFlowAsJSON = (data: FlowData, filename = 'flow-data.json') => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Import flow data from JSON file
 */
export const importFlowFromJSON = (): Promise<FlowData> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            resolve({
              nodes: data.nodes || [],
              edges: data.edges || [],
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      } else {
        reject(new Error('No file selected'));
      }
    };
    input.click();
  });
};

/**
 * Get count of incoming connections for a node
 */
export const getIncomingCount = (nodeId: string, edges: StageEdge[]): number => {
  return edges.filter((e) => e.target === nodeId).length;
};

/**
 * Get count of outgoing connections for a node
 */
export const getOutgoingCount = (nodeId: string, edges: StageEdge[]): number => {
  return edges.filter((e) => e.source === nodeId).length;
};
