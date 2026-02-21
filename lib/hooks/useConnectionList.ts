'use client';

import { useMemo } from 'react';
import { useReactFlow } from 'reactflow';
import { StageEdge, ConnectionInfo } from '@/types';

export function useConnectionList(edges: StageEdge[]): ConnectionInfo[] {
  const { getNode } = useReactFlow();

  return useMemo(() => {
    return edges.map((edge) => {
      const sourceNode = getNode(edge.source);
      const targetNode = getNode(edge.target);
      return {
        id: edge.id,
        from: sourceNode?.data?.title || edge.source,
        to: targetNode?.data?.title || edge.target,
      };
    });
  }, [edges, getNode]);
}
