# App presentation

Login and signup use a server-rendered `AuthShell` with small interactive forms. The dashboard keeps server-rendered pages and adds only a small client navigation component for active-route highlighting.

- Navy backgrounds and aqua primary actions connect the public, authentication, and dashboard pages.
- `app/dashboard/workspace.css` is scoped to `.workspace`. Shared `workspace-panel`, `workspace-stat`, and `workspace-action` classes style profile, settings, token, KYC, and admin views.
- Desktop navigation stays beside the content; smaller screens use horizontally scrollable navigation. Tables retain their existing scroll containers and admin account cards remain available on mobile.
- Animations use CSS transforms and opacity, with no animation dependency. Reduced-motion preferences disable animation and transitions.
- Semantic status colors remain unchanged, and keyboard focus rings remain visible.

Validation: production build, TypeScript, dashboard ESLint (existing avatar image warnings), and existing KYC/account regression tests. No authenticated browser visual review was performed for this styling pass.
