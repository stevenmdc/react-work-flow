'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Position, type EdgeProps } from 'reactflow';
import { EdgeActionControls } from './EdgeActionControls';

function getEdgeVariance(id: string) {
  return Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function createSketchPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  controlX1: number,
  controlX2: number,
  controlY1: number,
  controlY2: number,
) {
  return `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;
}

function getBezierPoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
) {
  const inverseT = 1 - t;
  return (
    inverseT ** 3 * p0 +
    3 * inverseT ** 2 * t * p1 +
    3 * inverseT * t ** 2 * p2 +
    t ** 3 * p3
  );
}

type SketchEdgeData = {
  isInteractive?: boolean;
  onReverse?: () => void;
  onDelete?: () => void;
};

function getDirectionVector(position: Position) {
  switch (position) {
    case Position.Left:
      return { x: -1, y: 0 };
    case Position.Right:
      return { x: 1, y: 0 };
    case Position.Top:
      return { x: 0, y: -1 };
    case Position.Bottom:
      return { x: 0, y: 1 };
    default:
      return { x: 1, y: 0 };
  }
}

export const SketchEdge = memo(function SketchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  markerEnd,
  style,
  data,
}: EdgeProps<SketchEdgeData>) {
  const variance = getEdgeVariance(id);
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const sourceVector = getDirectionVector(sourcePosition);
  const targetVector = getDirectionVector(targetPosition);
  const bend = Math.min(Math.max(Math.max(Math.abs(deltaX), Math.abs(deltaY)) * 0.32, 42), 120);
  const swingA = ((variance % 19) - 9) * 1.4;
  const swingB = ((Math.floor(variance / 19) % 19) - 9) * 1.4;
  const controlX1 = sourceX + sourceVector.x * bend + sourceVector.y * swingA;
  const controlY1 = sourceY + sourceVector.y * bend + sourceVector.x * swingA;
  const controlX2 = targetX + targetVector.x * bend - targetVector.y * swingB;
  const controlY2 = targetY + targetVector.y * bend - targetVector.x * swingB;
  const mainPath = createSketchPath(
    sourceX,
    sourceY,
    targetX,
    targetY,
    controlX1,
    controlX2,
    controlY1,
    controlY2,
  );
  const labelX = getBezierPoint(0.5, sourceX, controlX1, controlX2, targetX);
  const labelY = getBezierPoint(0.5, sourceY, controlY1, controlY2, targetY);
  const baseStrokeColor = style?.stroke ?? '#334155b3';
  const baseStrokeWidth = Number(style?.strokeWidth ?? 2.9);
  const interactionWidth = Math.max(baseStrokeWidth + 16, 20);
  const sketchMarkerId = `sketch-arrow-${id}`;
  const sketchMarkerEnd = markerEnd ? `url(#${sketchMarkerId})` : undefined;

  return (
    <g>
      <defs>
        <marker
          id={sketchMarkerId}
          markerWidth="20"
          markerHeight="20"
          refX="16"
          refY="10"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 2.5 2.4 L 17 10 L 2.5 17.4"
            fill="none"
            stroke={baseStrokeColor}
            strokeWidth={Math.max(baseStrokeWidth * 0.95, 2.2)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={mainPath}
        fill="none"
        stroke="transparent"
        strokeWidth={interactionWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pointerEvents: 'stroke' }}
      />
      <motion.path
        d={mainPath}
        fill="none"
        stroke={baseStrokeColor}
        strokeWidth={baseStrokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={sketchMarkerEnd}
        pointerEvents="none"
        opacity={0.92}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.92 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
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
