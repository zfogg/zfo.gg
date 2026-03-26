# Layout Component Design

**Date:** 2026-03-26
**Scope:** Create a reusable Layout component to consolidate shared Header/Footer/flex structure

## Problem

Currently, Header is duplicated across 8 page components (Home, Bitcoin, Gravity, Colorshifter, Email, EmailConfirm, EmailUnsubscribe, EmailUnsubscribeConfirm). Footer is rendered globally in App.jsx. The main flex container structure (`min-h-full flex flex-col`) is also in App.jsx. This creates scattered layout responsibilities.

## Solution

Extract layout into a single `Layout` component that wraps the entire Routes section in App.jsx.

### Component: `Layout` (new)

**Location:** `client/src/components/Layout.jsx`

**Props:**

- `subtitle` (optional string) — passed to Header component for pages that need it (currently only Home)
- `children` (ReactNode) — the Routes/pages that render in the flexible middle section

**Structure:**

```jsx
<div className="min-h-full flex flex-col">
  <Header subtitle={subtitle} />
  {children}
  <Footer />
</div>
```

**Responsibilities:**

- Provides the main flex container (min-h-full, flex, flex-col)
- Renders Header with optional subtitle
- Renders children (Routes) with flex-1 implicit parent
- Renders Footer

### Changes to `App.jsx`

**Before:**

```jsx
<div className="min-h-full flex flex-col">
  <Routes>...</Routes>
  <Footer />
</div>
```

**After:**

```jsx
<Layout>
  <Routes>...</Routes>
</Layout>
```

- Remove import of Footer
- Remove the `min-h-full flex flex-col` container div
- Wrap Routes in Layout component
- Keep QueryClientProvider and Router intact

### Changes to Page Components

Update all page components to remove Header imports and renders:

- **Home** — remove Header import, remove `<Header subtitle="..." />`, keep page structure as-is
- **Bitcoin** — remove Header import, remove `<Header />`, keep page structure
- **Gravity** — remove Header import, remove `<Header />`, keep page structure
- **Colorshifter** — remove Header import, remove `<Header />`, keep page structure and color effects
- **Email, EmailConfirm, EmailUnsubscribe, EmailUnsubscribeConfirm** — remove Header imports and renders

Each page will render as a flex-1 child of Layout automatically.

### Colorshifter Compatibility

Colorshifter applies styles via `useColorAnimation` hook:

- Sets `document.body.backgroundColor`
- Sets CSS variables on `document.documentElement`
- Adds/removes 'home-active' class on body

These operations are independent of DOM structure. Layout is a structural wrapper only and does not interfere. Colorshifter's dynamic styling will work unchanged.

## Files Changed

| File                                | Change                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------- |
| `client/src/components/Layout.jsx`  | New file                                                               |
| `client/src/App.jsx`                | Remove Footer import, remove flex container div, wrap Routes in Layout |
| `client/src/pages/Home.jsx`         | Remove Header import and render, keep subtitle in document.title       |
| `client/src/pages/Bitcoin.jsx`      | Remove Header import and render                                        |
| `client/src/pages/Gravity.jsx`      | Remove Header import and render                                        |
| `client/src/pages/Colorshifter.jsx` | Remove Header import and render                                        |
| `client/src/pages/email/*.jsx`      | Remove Header imports and renders (4 files)                            |

## Testing

- All pages render with Header visible
- Home displays correctly with no subtitle in Header
- Colorshifter color animations work as before
- Footer visible on all pages
- Flex layout maintains proper spacing (full viewport height, footer at bottom)
- Page content centers/aligns as designed

## Benefits

- Single source of truth for layout structure
- Removes ~15-20 lines of duplicated imports/renders
- Easier to add layout-wide features (analytics, global modals, etc.) in future
- Clearer separation of concerns
