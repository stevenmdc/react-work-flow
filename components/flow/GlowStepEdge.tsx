'use client';

import { memo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath } from 'reactflow';
import { motion } from 'framer-motion';

type GlowEdgeData = {
  beamColor?: string;
  duration?: number;
  delay?: number;
};

export const GlowStepEdge = memo(function GlowStepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<GlowEdgeData>) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  });

  const gradientId = `edge-gradient-${id}`;
  const beamColor = data?.beamColor ?? '#a855f7';
  const duration = data?.duration ?? 2.8;
  const delay = data?.delay ?? 0.35;
  const baseStrokeWidth = Number(style?.strokeWidth ?? 1.8);
  const baseStrokeColor = style?.stroke ?? '#334155b3';

  return (
    <g>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: baseStrokeColor,
          strokeWidth: baseStrokeWidth,
          strokeDasharray: 'none',
        }}
      />

      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0" stopColor={beamColor} stopOpacity="0" />
          <stop offset="0.5" stopColor={beamColor} stopOpacity="1" />
          <stop offset="1" stopColor={beamColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={baseStrokeWidth + 0.8}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${beamColor})` }}
        initial={{ pathLength: 0.2, pathOffset: 0 }}
        animate={{ pathOffset: [0, 1.2] }}
        transition={{
          duration,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
          repeatDelay: delay,
        }}
      />
    </g>
  );
});
