# Barbershop App - Development Guidelines

## Code Style

- **CSS via separate files**: All styles are organized by scope:
  - src/index.css - Global styles, CSS variables, utility classes, buttons, animations
  - src/layout.css - Shared panel/layout components (panel, headers, tabs)
  - src/components/ - Component folders, each with co-located JSX and CSS files
- **Component structure**: Each component lives in its own folder with PascalCase naming:
  - Example: src/components/HomeScreen/HomeScreen.jsx + src/components/HomeScreen/HomeScreen.css
  - Shared components in src/components/common/ (e.g., Row.jsx)
- **Variable naming**: camelCase for functions and variables. Use descriptive names (formCard, loyaltyBadge).
- **CSS variables**: Theme colors are defined via CSS custom properties: --bg, --text, --gold, --muted, --border, --surface, --surface2, etc. Reference them as var(--bg) in CSS.
- **CSS class names**: Use kebab-case for CSS classes (e.g., panel-header, btn-primary). Apply classes via className prop in JSX.

## Architecture

**View-based navigation**: App.jsx manages three main views:
- home - HomeScreen: Welcome & entry point
- client - ClientFlow: Booking flow for customers
- barber - BarberPanel: Admin dashboard (password: "1234")

**Data flow**:
- App.jsx holds global state (data) via useState
- loadData() in src/utils/data.js retrieves from localStorage or returns defaults
- update() wrapper ensures immutability: uses structuredClone() -> calls reducer -> calls saveData() -> updates state
- All components receive data and update as props

**Component structure**:
- **Smart components** (HomeScreen, ClientFlow, BarberPanel): manage view layout and orchestrate tabs/steps.
- **Tab components** (AgendaTab, SlotsTab, LoyaltyTab, ClientsTab): handle feature isolation within a view.
- **Presentational components** (LoyaltyBadge, Row): reusable UI pieces, pure display logic.

## Build and Test

```bash
npm install    # Install dependencies
npm run dev    # Start dev server (Vite) -> http://localhost:5173
npm run build  # Production build -> dist/
npm run preview # Preview production build
```

## Conventions

**Immutable updates**: Always clone state before mutating:
```javascript
const update = (fn) => setData((prev) => {
  const next = fn(structuredClone(prev));
  saveData(next);
  return next;
});
```

**LocalStorage persistence**: data.js exposes loadData() and saveData(). Default data structure includes clients, appointments, availableSlots, loyaltyConfig, barberPassword.

**Phone formatting**: Use formatPhone(value) from data.js to format phone inputs as (XX) XXXXX-XXXX.

**Service catalog**: SERVICES array in data.js defines available services with id, label, and price. Modify here to add new services.

**Loyalty reward**: Auto-calculated: every loyaltyConfig.cutsRequired (default 5) completed appointments grants one free cut. See LoyaltyBadge.

**CSS Classes**: Use semantic class names from component CSS files. Examples:
- Layout: .panel, .panel-header, .panel-body
- Forms: .form-card, .input, .card-title
- Buttons: .btn-primary, .btn-ghost, .btn-sm
- State: .active, .fade-in

Apply multiple classes with template literals: className={`card ${isActive ? 'active' : ''}`}

## Common Pitfalls

- **Mutable updates**: Don't modify state directly (e.g., data.clients[phone] = {...}). Always use update().
- **Inline styles**: Don't use style={{}} for static styles. Use className instead.
- **CSS class names**: Use exact names from component CSS files and layout.css. When in doubt, search for similar patterns.
- **localStorage key**: Fixed key "barbearia_data" in data.js - changing it orphans saved data.
- **Password hardcoded**: Barber password is "1234" in defaultData. Use environment variable for production.

## New Feature Workflow

1. Define data shape in defaultData (data.js).
2. Create a new component folder in src/components/ (e.g., src/components/NewComponent/).
3. Create NewComponent.jsx and NewComponent.css inside the folder.
4. Import the CSS file at the top of the component: import "./NewComponent.css"
5. Use semantic class names via className prop. Reserve style prop for dynamic values only.
6. For shared styles, add to layout.css or update index.css.
7. If the component needs a default export via index.js, create index.js in the folder.
8. Update App.jsx or parent component import paths to reference the new folder.
9. Pass data and update props; use update() for mutations.
10. Test in dev mode: npm run dev.

---

**See also**: README.md for project overview and user guide.
