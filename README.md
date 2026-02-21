# Customer Journey Flow

Customer Journey Flow is a visual editor to design and iterate customer journey stages.
It is built with Next.js (App Router) and React Flow.

## What It Does

- Start from a default journey (Awareness → Purchase)
- Drag and drop stage templates from the left sidebar
- Connect stages with animated edges
- Reconnect or delete links
- Edit node content in a right-side inspector
- Pick Lucide icons for each node (searchable icon picker)
- Persist graph data in `localStorage`
- Switch between light and dark themes

## Tech Stack

- Next.js 16 (App Router)
- React 19
- React Flow 11
- Tailwind CSS 4
- TypeScript
- next-themes
- lucide-react

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  globals.css

components/
  flow/
    FlowEditor.tsx
    StageNode.tsx
    NodesSidebar.tsx
    NodeInspector.tsx
    node-inspector/
      Fields.tsx
      IconPickerField.tsx
      NodeInspectorEmptyState.tsx
    index.ts
  theme/
    ThemeToggle.tsx

lib/
  flowUtils.ts
  stageIcons.ts

types/
  index.ts
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev    # start dev server
npm run lint   # run ESLint
npm run build  # production build check
npm run start  # run production server
```

## Usage Notes

- Double-click a node title to edit it inline.
- Click a node to edit details in the inspector.
- Use the icon picker (`Search icon`) to select from Lucide icons.
- Click an edge to select it, then delete with:
  - `Delete` / `Backspace`
  - double-click on edge
  - `Delete link` button in toolbar
- Drag edge endpoints to reconnect links.

## Persistence

Flow state is automatically saved to browser `localStorage`.

Storage key:

```text
customer-journey-flow:flow:v1
```

To reset data quickly, clear this key in DevTools.

## Styling & Theme

- Tailwind CSS utilities drive all UI styling.
- Dark mode is managed by `next-themes` and class-based dark variants.

## Development Checklist

Before shipping changes:

```bash
npm run lint
npm run build
```

## License

Private project (no license file provided).
