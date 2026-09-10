# Admin Panel Code Style & Engineering Rules

## 1. Zero Hardcoding Rule
- **Text & Labels**: Never hardcode user-facing strings directly inside components. Store UI strings, form labels, tooltips, and page headers in constant files under `src/constants/`.
- **Colors & Styling**: Do not use ad-hoc hex codes or inline styles (e.g. `style={{ color: '#1E293B' }}`). Use Tailwind CSS design tokens or color constants mapped in `src/constants/colors.ts`.
- **Route Paths**: Never hardcode URL paths (e.g., `navigate('/operators')`). Use the route path enum/object in `src/constants/routes.ts` (e.g. `ROUTES.OPERATORS`).
- **Permissions & Roles**: Permission keys (`resource:action`) and role identifiers must come from `src/constants/permissions.ts`.
- **API & Configuration**: Storage keys, API endpoints, pagination limits, and default format masks must be imported from `src/constants/config.ts`.

---

## 2. Architecture & Design System

### Directory Structure
```
src/
├── constants/       # Centralized design tokens, route paths, permissions, app config
├── types/           # Domain interfaces (Auth, Bus, Operator, Route, Trip, Booking, etc.)
├── context/         # React Contexts (AuthContext, ThemeContext, SidebarContext)
├── hooks/           # Custom reusable hooks (useAuth, usePermission, useSidebar)
├── lib/             # Utility helpers (clsx/tailwind-merge, date formatting, formatters)
├── components/
│   ├── ui/          # Atomic primitives (button, card, input, table, badge, dropdown)
│   ├── common/      # ProtectedRoute, PermissionGate, MetricCard, DataTable
│   ├── layout/      # AdminLayout, Sidebar, Header, Breadcrumbs, UserDropdown
│   └── auth/        # LoginForm, AuthGuard
└── pages/           # Route View Components (Dashboard, Operators, Buses, Routes, etc.)
```

### Component Guidelines
- **Keep Views Clean**: Route pages (`src/pages/*`) should handle layout assembly, state binding, and table/card rendering. Complex business logic and state transformations belong in services or custom hooks.
- **Strict TypeScript**: Every component prop, state, API response, and event handler must be explicitly typed. `any` is strictly prohibited.
- **Aesthetic Excellence**: Follow modern glassmorphic, sleek slate dark/light styling with consistent borders (`border-border`), subtle shadows (`shadow-sm`), rounded corners (`rounded-xl`), and micro-interactions on hover.

---

## 3. Auth & Role-Based Access Control (RBAC)

### Auth Context (`AuthContext`)
- Manages authentication state (`user`, `token`, `isAuthenticated`, `isLoading`).
- Persists session tokens securely in `localStorage` under `APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN`.
- Exposes `login(credentials)`, `logout()`, `hasPermission(resource, action)`, and `hasRole(role)`.

### RBAC Directives
- **Protected Routes**: Wrap layout routes using `ProtectedRoute`. If not logged in, redirect seamlessly to `ROUTES.LOGIN`.
- **Granular Action Gates**: Wrap actions (e.g., "Create Operator", "Cancel Booking", "Edit Route") with `PermissionGate` specifying required resource and action.
- **Navigation Guard**: Sidebar navigation items filter automatically based on user roles and permissions.

---

## 4. State & Data Table Conventions

- **Data Tables**: Use `DataTable` standardizing column definitions, sorting, searching, status badge rendering, and pagination.
- **Status Badges**: Use standard `StatusBadge` mapping entity status (e.g., `CONFIRMED`, `PENDING`, `CANCELLED`, `ACTIVE`, `MAINTENANCE`) to centralized colors in `src/constants/colors.ts`.
- **Form Validation**: Validate all inputs before submitting to mock or live API services. Show clear error states.

---

## 5. Modal & Page Architecture Standard

- **Unified Drawer/Modal Component**:
  - Every entity (Operators, Buses, Routes, etc.) must use **one common modal component** (e.g. `OperatorDrawer`).
  - Modes determined via `const isViewMode = !!entity?.viewMode` and `const isEditMode = !!entity?.id`.
  - Use `useForm` from `react-hook-form` with initial constant data.
  - Reset form in `useEffect` on `open` state change.
  - Use `@tanstack/react-query` `useMutation` for create and update actions, invalidating `queryKeys` on success.
  - Wrap modal layout inside `FormContainer` with `sectionHeader`, `FormField`, and `FormSelectField` passing `readOnly={isViewMode}`.
- **Page Component Architecture**:
  - Use `useDisclosure<any>()` for managing modal and confirm delete dialog state.
  - Use `useSearchFilter(INITIAL_FILTERS)` for filtering.
  - Use `useQuery` for fetching list data.
  - Use `SectionCard`, `FilterBar`, and `ConfirmDialog` for page layout and actions.

