'use client';

import { memo } from 'react';
import { BaseEdge, EdgeProps, Position, getSmoothStepPath } from 'reactflow';
import { motion } from 'framer-motion';
import { EdgeActionControls } from './EdgeActionControls';

type GlowEdgeData = {
  beamColor?: string;
  duration?: number;
  delay?: number;
  isInteractive?: boolean;
  onReverse?: () => void;
  onDelete?: () => void;
  sourceBundleOffset?: number;
  targetBundleOffset?: number;
};

function getBundleShift(position: Position, amount: number) {
  switch (position) {
    case Position.Top:
    case Position.Bottom:
      return { x: amount, y: 0 };
    case Position.Left:
    case Position.Right:
    default:
      return { x: 0, y: amount };
  }
}

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
  const sourceShift = getBundleShift(
    sourcePosition ?? Position.Right,
    data?.sourceBundleOffset ?? 0,
  );
  const targetShift = getBundleShift(
    targetPosition ?? Position.Left,
    data?.targetBundleOffset ?? 0,
  );
  const adjustedSourceX = sourceX + sourceShift.x;
  const adjustedSourceY = sourceY + sourceShift.y;
  const adjustedTargetX = targetX + targetShift.x;
  const adjustedTargetY = targetY + targetShift.y;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: adjustedSourceX,
    sourceY: adjustedSourceY,
    sourcePosition,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
    targetPosition,
    borderRadius: 0,
  });

  const gradientId = `edge-gradient-${id}`;
  const beamColor = data?.beamColor ?? '#a855f7';
  const duration = data?.duration ?? 2.8;
  const delay = data?.delay ?? 0.35;
  const baseStrokeWidth = Number(style?.strokeWidth ?? 1.8);
  const baseStrokeColor = style?.stroke ?? '#334155b3';
  const interactionWidth = Math.max(baseStrokeWidth + 18, 22);

  return (
    <g>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={interactionWidth}
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
          x1={adjustedSourceX}
          y1={adjustedSourceY}
          x2={adjustedTargetX}
          y2={adjustedTargetY}
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
        pointerEvents="none"
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
      <EdgeActionControls
        x={labelX}
        y={labelY}
        visible={Boolean(data?.isInteractive)}
        onReverse={data?.onReverse}
        onDelete={data?.onDelete}
      />
    </g>
  );
});
