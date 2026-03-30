"use client";

import { motion } from "framer-motion";

type ArrowConnectorProps = {
  stepNumber: number;
};

const CURVES = [
  "M14 110 C88 80, 140 24, 210 54 S324 140, 392 102",
  "M14 104 C92 52, 154 44, 222 84 S328 146, 392 96",
  "M14 112 C84 92, 154 8, 234 50 S326 144, 392 112",
];

export default function ArrowConnector({ stepNumber }: ArrowConnectorProps) {
  const path = CURVES[(stepNumber - 1) % CURVES.length];

  return (
    <div className="pointer-events-none absolute top-1/2 left-[35%] hidden w-[30%] -translate-y-1/2 xl:block">
      <svg
        viewBox="0 0 408 160"
        className="h-[160px] w-full overflow-visible"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={`workflow-arrow-head-${stepNumber}`}
            markerWidth="16"
            markerHeight="16"
            refX="12"
            refY="8"
            orient="auto-start-reverse"
          >
            <path
              d="M1 1 L13 8 L1 15"
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </marker>
        </defs>
        <motion.path
          d={path}
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={`url(#workflow-arrow-head-${stepNumber})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.9,
            delay: 0.2 + stepNumber * 0.08,
            ease: "easeInOut",
          }}
        />
      </svg>
    </div>
  );
}
