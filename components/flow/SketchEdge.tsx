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
  sourceBundleOffset?: number;
  targetBundleOffset?: number;
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
  const variance = getEdgeVariance(id);
  const deltaX = adjustedTargetX - adjustedSourceX;
  const deltaY = adjustedTargetY - adjustedSourceY;
  const sourceVector = getDirectionVector(sourcePosition);
  const targetVector = getDirectionVector(targetPosition);
  const bend = Math.min(Math.max(Math.max(Math.abs(deltaX), Math.abs(deltaY)) * 0.32, 42), 120);
  const swingA = ((variance % 19) - 9) * 1.4;
  const swingB = ((Math.floor(variance / 19) % 19) - 9) * 1.4;
  const controlX1 =
    adjustedSourceX + sourceVector.x * bend + sourceVector.y * swingA;
  const controlY1 =
    adjustedSourceY + sourceVector.y * bend + sourceVector.x * swingA;
  const controlX2 =
    adjustedTargetX + targetVector.x * bend - targetVector.y * swingB;
  const controlY2 =
    adjustedTargetY + targetVector.y * bend - targetVector.x * swingB;
  const mainPath = createSketchPath(
    adjustedSourceX,
    adjustedSourceY,
    adjustedTargetX,
    adjustedTargetY,
    controlX1,
    controlX2,
    controlY1,
    controlY2,
  );
  const labelX = getBezierPoint(
    0.5,
    adjustedSourceX,
    controlX1,
    controlX2,
    adjustedTargetX,
  );
  const labelY = getBezierPoint(
    0.5,
    adjustedSourceY,
    controlY1,
    controlY2,
    adjustedTargetY,
  );
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
