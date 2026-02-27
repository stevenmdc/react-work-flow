import { Edge, Node } from 'reactflow';

export type StageParamValue = string | number | boolean;
export type StageParams = Record<string, StageParamValue>;

export interface StageImageAsset {
  src: string;
  name: string;
  mimeType: string;
  bytes: number;
  width: number;
  height: number;
}

export type NodeCategory =
  | 'awareness'
  | 'interest'
  | 'consideration'
  | 'intent'
  | 'purchase';

export type StageIconKey = string;

export interface StageData {
  title: string;
  description: string;
  category?: NodeCategory;
  icon?: StageIconKey;
  params?: StageParams;
  badges?: string[];
  image?: StageImageAsset | null;
}

export type StageNode = Node<StageData>;
export type StageEdge = Edge;

export interface ConnectionInfo {
  id: string;
  from: string;
  to: string;
}

export interface FlowData {
  nodes: StageNode[];
  edges: StageEdge[];
}

export interface NodeCategoryStyle {
  label: string;
  accent: string;
}

export const NODE_CATEGORY_CONFIG: Record<NodeCategory, NodeCategoryStyle> = {
  awareness: { label: 'Awareness', accent: '#38bdf8' },
  interest: { label: 'Interest', accent: '#a78bfa' },
  consideration: { label: 'Consideration', accent: '#f59e0b' },
  intent: { label: 'Intent', accent: '#34d399' },
  purchase: { label: 'Purchase', accent: '#fb7185' },
};

export interface NodeTemplate {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: NodeCategory;
  defaultData: StageData;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    id: 'awareness',
    label: 'Awareness',
    description: 'How customers first discover your brand.',
    icon: '📣',
    category: 'awareness',
    defaultData: {
      title: 'Awareness',
      description: 'Customer discovers your brand through ads, content, or referrals.',
      category: 'awareness',
      icon: 'Megaphone',
      params: { channel: 'Social + Search' },
      badges: ['Top funnel'],
    },
  },
  {
    id: 'interest',
    label: 'Interest',
    description: 'Engagement and early exploration.',
    icon: '🔎',
    category: 'interest',
    defaultData: {
      title: 'Interest',
      description: 'Customer explores your offer and starts evaluating fit.',
      category: 'interest',
      icon: 'Search',
      params: { contentType: 'Feature page' },
      badges: ['Engagement'],
    },
  },
  {
    id: 'consideration',
    label: 'Consideration',
    description: 'Comparison versus alternatives.',
    icon: '⚖️',
    category: 'consideration',
    defaultData: {
      title: 'Consideration',
      description: 'Customer compares options, pricing, and proof points.',
      category: 'consideration',
      icon: 'Scale',
      params: { proof: 'Case studies + Reviews' },
      badges: ['Evaluation'],
    },
  },
  {
    id: 'intent',
    label: 'Intent',
    description: 'High buying intent signals.',
    icon: '🎯',
    category: 'intent',
    defaultData: {
      title: 'Intent',
      description: 'Customer asks final questions and plans purchase timing.',
      category: 'intent',
      icon: 'Target',
      params: { trigger: 'Demo request' },
      badges: ['High intent'],
    },
  },
  {
    id: 'purchase',
    label: 'Purchase',
    description: 'Checkout or contract signature.',
    icon: '🛒',
    category: 'purchase',
    defaultData: {
      title: 'Purchase',
      description: 'Customer completes checkout and receives confirmation.',
      category: 'purchase',
      icon: 'ShoppingCart',
      params: { conversionGoal: 'Order completed' },
      badges: ['Conversion'],
    },
  },
];
