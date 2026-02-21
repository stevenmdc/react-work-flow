import { createElement, type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { Circle } from 'lucide-react';
import type { NodeCategory, StageData, StageIconKey } from '@/types';

const INTERNAL_EXPORTS = new Set(['createLucideIcon', 'Icon', 'icons']);

const LEGACY_ICON_ALIASES: Record<string, string> = {
  megaphone: 'Megaphone',
  search: 'Search',
  scale: 'Scale',
  target: 'Target',
  'shopping-cart': 'ShoppingCart',
  users: 'Users',
  'message-square': 'MessageSquare',
  mail: 'Mail',
  globe: 'Globe',
  handshake: 'Handshake',
};

const CATEGORY_DEFAULT_ICON: Record<NodeCategory, string> = {
  awareness: 'Megaphone',
  interest: 'Search',
  consideration: 'Scale',
  intent: 'Target',
  purchase: 'ShoppingCart',
};

type LucideComponent = ComponentType<LucideProps>;

function isLucideIconExport(value: unknown): value is LucideComponent {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;

  const candidate = value as { $$typeof?: unknown; render?: unknown };
  return typeof candidate.$$typeof === 'symbol' && typeof candidate.render === 'function';
}

function humanizeIconName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1 $2');
}

function getRawLucideIcon(name: string): LucideComponent | null {
  if (INTERNAL_EXPORTS.has(name)) return null;
  const candidate = (LucideIcons as Record<string, unknown>)[name];
  return isLucideIconExport(candidate) ? candidate : null;
}

function normalizeIconName(icon?: string): string | null {
  if (!icon) return null;
  if (getRawLucideIcon(icon)) return icon;
  const alias = LEGACY_ICON_ALIASES[icon.toLowerCase()];
  return alias && getRawLucideIcon(alias) ? alias : null;
}

export interface StageIconOption {
  key: StageIconKey;
  label: string;
  searchText: string;
  Icon: LucideComponent;
}

export const STAGE_ICON_OPTIONS: StageIconOption[] = Object.entries(
  LucideIcons as Record<string, unknown>
)
  .filter(([name, value]) => !INTERNAL_EXPORTS.has(name) && isLucideIconExport(value))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, value]) => {
    const label = humanizeIconName(name);
    return {
      key: name,
      label,
      searchText: `${name} ${label}`.toLowerCase(),
      Icon: value as LucideComponent,
    };
  });

export function getDefaultStageIcon(category?: NodeCategory): StageIconKey {
  return CATEGORY_DEFAULT_ICON[category ?? 'consideration'];
}

export function getResolvedStageIconName(
  data: Pick<StageData, 'category' | 'icon'>
): StageIconKey {
  return normalizeIconName(data.icon) ?? getDefaultStageIcon(data.category);
}

export function getStageIconComponent(
  icon: StageData['icon'],
  category?: NodeCategory
): LucideComponent {
  const resolved = normalizeIconName(icon) ?? getDefaultStageIcon(category);
  return getRawLucideIcon(resolved) ?? Circle;
}

export function renderStageIcon(
  icon: StageData['icon'],
  category: NodeCategory | undefined,
  props: LucideProps
) {
  return createElement(getStageIconComponent(icon, category), props);
}
