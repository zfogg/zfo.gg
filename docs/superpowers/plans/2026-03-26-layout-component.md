# Layout Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate shared Header/Footer structure into a single Layout component used in App.jsx so all pages render inside it.

**Architecture:** Create a new Layout component that provides the flex container, Header, and Footer. App.jsx wraps Routes in Layout. Each page removes its own Header import/render. Colorshifter's dynamic styling remains unaffected.

**Tech Stack:** React, React Router, Tailwind CSS

---

### Task 1: Create Layout Component

**Files:**

- Create: `client/src/components/Layout.jsx`

- [ ] **Step 1: Write Layout component with Header, children, Footer**

Create `client/src/components/Layout.jsx`:

```jsx
import Header from "./Header";
import Footer from "./Footer";

const Layout = ({ subtitle, children }) => {
  return (
    <div className="min-h-full flex flex-col">
      <Header subtitle={subtitle} />
      {children}
      <Footer />
    </div>
  );
};

export default Layout;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Layout.jsx
git commit -m "feat: create Layout component with Header and Footer"
```

---

### Task 2: Update App.jsx

**Files:**

- Modify: `client/src/App.jsx`

- [ ] **Step 1: Remove Footer import and update div structure**

Replace the entire App.jsx file:

```jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFlowType } from "./hooks/useFlowType";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Bitcoin from "./pages/Bitcoin";
import Gravity from "./pages/Gravity";
import Colorshifter from "./pages/Colorshifter";
import Email from "./pages/email/Email";
import EmailConfirm from "./pages/email/EmailConfirm";
import EmailUnsubscribe from "./pages/email/EmailUnsubscribe";
import EmailUnsubscribeConfirm from "./pages/email/EmailUnsubscribeConfirm";
import NotFound from "./pages/NotFound";

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  // Apply responsive typography (FlowType.js replacement)
  useFlowType({
    minimum: 320,
    maximum: 960,
    minFont: 20,
    maxFont: 32,
    fontRatio: 32,
    lineRatio: 1.45,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bitcoin" element={<Bitcoin />} />
            <Route path="/thing/gravity" element={<Gravity />} />
            <Route path="/thing/colorshifter" element={<Colorshifter />} />
            <Route path="/email" element={<Email />} />
            <Route path="/email/confirm" element={<EmailConfirm />} />
            <Route path="/email/unsubscribe" element={<EmailUnsubscribe />} />
            <Route path="/email/unsubscribe/confirm" element={<EmailUnsubscribeConfirm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/App.jsx
git commit -m "refactor(app): wrap Routes in Layout, remove Footer from App"
```

---

### Task 3: Update Home.jsx

**Files:**

- Modify: `client/src/pages/Home.jsx:1-3`

- [ ] **Step 1: Remove Header import**

In `client/src/pages/Home.jsx`, remove this line:

```jsx
import Header from "../components/Header";
```

- [ ] **Step 2: Remove Header component render**

In the same file, find this section:

```jsx
<div className="absolute inset-0 flex flex-col pointer-events-none">
  <Header subtitle="Zachary Fogg's personal website" />
```

Remove the `<Header subtitle="Zachary Fogg's personal website" />` line. Keep the div and everything after it:

```jsx
<div className="absolute inset-0 flex flex-col pointer-events-none">
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/Home.jsx
git commit -m "refactor(home): remove Header from page"
```

---

### Task 4: Update Bitcoin.jsx

**Files:**

- Modify: `client/src/pages/Bitcoin.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/Bitcoin.jsx` and:

1. Remove the line: `import Header from "../components/Header";`
2. Find and remove the line: `<Header />`

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Bitcoin.jsx
git commit -m "refactor(bitcoin): remove Header from page"
```

---

### Task 5: Update Gravity.jsx

**Files:**

- Modify: `client/src/pages/Gravity.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/Gravity.jsx` and:

1. Remove the line: `import Header from "../components/Header";`
2. Find and remove the line: `<Header />`

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Gravity.jsx
git commit -m "refactor(gravity): remove Header from page"
```

---

### Task 6: Update Colorshifter.jsx

**Files:**

- Modify: `client/src/pages/Colorshifter.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/Colorshifter.jsx` and:

1. Remove the line: `import Header from "../components/Header";`
2. Find and remove the line: `<Header />`

Note: Colorshifter's color effects and styling (document.body.backgroundColor, CSS variables) remain unchanged and unaffected by Layout.

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Colorshifter.jsx
git commit -m "refactor(colorshifter): remove Header from page"
```

---

### Task 7: Update Email.jsx

**Files:**

- Modify: `client/src/pages/email/Email.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/email/Email.jsx` and:

1. Remove the line: `import Header from "../../components/Header";`
2. Find and remove the line: `<Header />`

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/email/Email.jsx
git commit -m "refactor(email): remove Header from page"
```

---

### Task 8: Update EmailConfirm.jsx

**Files:**

- Modify: `client/src/pages/email/EmailConfirm.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/email/EmailConfirm.jsx` and:

1. Remove the line: `import Header from "../../components/Header";`
2. Find and remove the line: `<Header />`

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/email/EmailConfirm.jsx
git commit -m "refactor(email-confirm): remove Header from page"
```

---

### Task 9: Update EmailUnsubscribe.jsx

**Files:**

- Modify: `client/src/pages/email/EmailUnsubscribe.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/email/EmailUnsubscribe.jsx` and:

1. Remove the line: `import Header from "../../components/Header";`
2. Find and remove the line: `<Header />`

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/email/EmailUnsubscribe.jsx
git commit -m "refactor(email-unsubscribe): remove Header from page"
```

---

### Task 10: Update EmailUnsubscribeConfirm.jsx

**Files:**

- Modify: `client/src/pages/email/EmailUnsubscribeConfirm.jsx`

- [ ] **Step 1: Remove Header import and render**

Open `client/src/pages/email/EmailUnsubscribeConfirm.jsx` and:

1. Remove the line: `import Header from "../../components/Header";`
2. Find and remove the line: `<Header />`

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/email/EmailUnsubscribeConfirm.jsx
git commit -m "refactor(email-unsubscribe-confirm): remove Header from page"
```

---

### Task 11: Verify All Pages Render

**Files:**

- Test: All pages in `client/src/pages/`

- [ ] **Step 1: Start dev server**

```bash
cd client && vp dev
```

Expected: Server starts successfully at `http://localhost:5173` (or similar)

- [ ] **Step 2: Test Home page**

Navigate to `http://localhost:5173/` in browser.

Expected:

- Header with "zfogg" title visible at top
- Canvas/grid animation visible
- "I make things, like" section with cards visible
- Footer with social icons visible at bottom
- No console errors

- [ ] **Step 3: Test Colorshifter page**

Navigate to `http://localhost:5173/thing/colorshifter`.

Expected:

- Header with "zfogg" title visible at top
- Color animation active (background color changing)
- Controls visible and functional
- Footer visible at bottom
- Color effects work as before (document.body.backgroundColor applied correctly)
- No console errors

- [ ] **Step 4: Test Gravity page**

Navigate to `http://localhost:5173/thing/gravity`.

Expected:

- Header with "zfogg" title visible at top
- Canvas animation visible
- Controls visible and functional
- Footer visible at bottom
- No console errors

- [ ] **Step 5: Test Email pages**

Navigate to `http://localhost:5173/email`.

Expected:

- Header with "zfogg" title visible at top
- Email signup form visible and centered
- Footer visible at bottom
- No console errors

Navigate to other email routes (`/email/confirm`, `/email/unsubscribe`, etc.) and verify Header/Footer visible on each.

- [ ] **Step 6: Test Bitcoin page**

Navigate to `http://localhost:5173/bitcoin`.

Expected:

- Header with "zfogg" title visible at top
- Page content visible
- Footer visible at bottom
- No console errors

- [ ] **Step 7: Test NotFound page**

Navigate to `http://localhost:5173/invalid-route`.

Expected:

- Header with "zfogg" title visible at top
- 404 message visible
- Footer visible at bottom
- No console errors

- [ ] **Step 8: Run linting and format checks**

```bash
vp check
```

Expected: All checks pass (format, lint, type)

- [ ] **Step 9: Run tests if any exist**

```bash
vp test
```

Expected: All tests pass (or no test output if no tests exist)
