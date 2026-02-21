import { StageNode } from '@/types';

export const defaultStages = [
  {
    id: 'awareness',
    title: 'Awareness',
    description: 'Customer first discovers your product through ads, content, referrals, or social.',
  },
  {
    id: 'consideration',
    title: 'Consideration',
    description: 'Customer compares options, reads reviews, and checks fit for their needs.',
  },
  {
    id: 'decision',
    title: 'Decision',
    description: 'Customer evaluates pricing and trust signals; final questions get answered.',
  },
  {
    id: 'purchase',
    title: 'Purchase',
    description: 'Customer completes checkout (or signs) and receives confirmation.',
  },
];

export const defaultNodes: StageNode[] = defaultStages.map((stage, index) => ({
  id: stage.id,
  data: { title: stage.title, description: stage.description },
  position: { x: index * 320, y: 100 },
  type: 'stageNode',
}));

export const defaultEdges = [];

export const COLORS = {
  primary: '#3B82F6',
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    600: '#4b5563',
    700: '#374151',
    900: '#111827',
  },
};

export const KEYBOARD_SHORTCUTS = {
  DELETE: ['Delete', 'Backspace'],
  ESCAPE: 'Escape',
  EDIT: 'double-click',
};
