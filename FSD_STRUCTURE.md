# FSD (Feature-Sliced Design) Architecture - Project Structure

## Overview

This project has been refactored to use Feature-Sliced Design (FSD), a scalable and maintainable architecture pattern for frontend applications.

## Directory Structure

```
src/
├── app/                          # Application initialization and global config
│   ├── config/
│   │   └── appConfig.js         # Global app configuration
│   └── styles/
│       └── globals.css          # Global styles (moved to shared)
│
├── pages/                        # Page-level components
│   ├── funMode/
│   │   ├── sections/            # Page sections
│   │   │   ├── Hero.jsx
│   │   │   ├── About.jsx
│   │   │   ├── WorkGrid.jsx
│   │   │   ├── Process.jsx
│   │   │   ├── TickerSection.jsx
│   │   │   └── Footer.jsx
│   │   └── FunModePage.jsx      # Main page component
│   │
│   └── normalMode/
│       └── NormalModePage.jsx
│
├── features/                     # Feature modules (business logic)
│   ├── modeSelection/            # Mode selection feature
│   │   ├── ui/
│   │   │   ├── ModeSelector.jsx
│   │   │   └── ModeSelector.css
│   │   ├── model/               # Business logic
│   │   └── index.js
│   │
│   └── terminalMode/            # Terminal interface feature
│       ├── ui/
│       │   ├── Terminal.jsx
│       │   └── index.js
│       ├── lib/
│       │   ├── CommandParser.jsx
│       │   ├── TerminalViews.jsx
│       │   └── index.js
│       └── index.js
│
├── entities/                     # Domain entities (data models)
│   └── portfolio/
│       └── model/
│           ├── portfolioData.js  # Portfolio constants and data
│           └── index.js
│
├── widgets/                      # Composite components
│   ├── header/
│   │   ├── Navbar.jsx
│   │   └── Ticker.jsx
│   ├── footer/
│   ├── NormalModeLayout.jsx      # Complex layout component
│   └── index.js
│
├── shared/                       # Shared utilities and components
│   ├── ui/                       # Reusable UI components
│   │   ├── CustomCursor.jsx
│   │   ├── Preloader.jsx
│   │   ├── ReturnToStartButton.jsx
│   │   ├── Squiggle.jsx
│   │   ├── SnakeBackground.jsx
│   │   ├── SnakeSquiggle.jsx
│   │   └── index.js
│   ├── lib/                      # Utility functions
│   │   └── index.js
│   ├── styles/                   # Global styles
│   │   └── globals.css
│   └── index.js
│
├── App.jsx                       # Root component (uses all layers)
├── App.css
├── main.jsx
└── index.css
```

## Layer Descriptions

### 🎯 App Layer (`/app`)

- Application initialization and setup
- Global configuration
- Entry point configuration

### 📄 Pages Layer (`/pages`)

- Complete page components
- Route-based views
- Orchestrate features and entities
- Examples: FunModePage, NormalModePage

### ⚙️ Features Layer (`/features`)

- Independent business features
- Self-contained with UI + logic
- Reusable across pages
- Structure: `ui/` (components) + `model/` (logic) + `lib/` (utilities)
- Examples: modeSelection, terminalMode

### 📊 Entities Layer (`/entities`)

- Domain-specific data and business logic
- Constants, data models, types
- Reusable across features
- Examples: portfolioData (projects, skills, process)

### 🧩 Widgets Layer (`/widgets`)

- Complex composite components
- Combine multiple entities/shared components
- Not page-specific, reusable layouts
- Examples: Navbar, NormalModeLayout

### 🎁 Shared Layer (`/shared`)

- Fully reusable across the entire application
- No dependencies on other layers
- `ui/`: Generic UI components (CustomCursor, Preloader, etc.)
- `lib/`: Utility functions and helpers
- `styles/`: Global styles

## Separation of Concerns

| Layer        | Purpose        | Example                           |
| ------------ | -------------- | --------------------------------- |
| **App**      | Initialization | Config, global setup              |
| **Pages**    | Page structure | FunModePage orchestration         |
| **Features** | Business logic | Terminal commands, mode selection |
| **Entities** | Data models    | Portfolio data constants          |
| **Widgets**  | Composite UI   | Navbar, complex layouts           |
| **Shared**   | Reusables      | Cursor, preloader, utilities      |

## Import Paths

```javascript
// ❌ DON'T (circular dependencies)
import { About } from "./components/About";

// ✅ DO (layer-aware imports)
import About from "@/pages/funMode/sections/About";
import { projectsData } from "@/entities/portfolio/model";
import ModeSelector from "@/features/modeSelection/ui/ModeSelector";
import CustomCursor from "@/shared/ui/CustomCursor";
```

## Benefits of FSD

1. **Scalability**: Easy to add new features without affecting existing code
2. **Maintainability**: Clear structure and separation of concerns
3. **Reusability**: Shared components and utilities across features
4. **Testability**: Isolated features are easier to test
5. **Team Collaboration**: Clear boundaries and ownership
6. **Code Organization**: No nested component hell

## Migration from Old Structure

### Old Components → New Locations

| Old                           | New                                          |
| ----------------------------- | -------------------------------------------- |
| `components/ModeSelector.jsx` | `features/modeSelection/ui/ModeSelector.jsx` |
| `components/CustomCursor.jsx` | `shared/ui/CustomCursor.jsx`                 |
| `components/Preloader.jsx`    | `shared/ui/Preloader.jsx`                    |
| `components/Terminal.jsx`     | `features/terminalMode/ui/Terminal.jsx`      |
| `components/Navbar.jsx`       | `widgets/header/Navbar.jsx`                  |
| `components/Hero.jsx`         | `pages/funMode/sections/Hero.jsx`            |
| `components/About.jsx`        | `pages/funMode/sections/About.jsx`           |
| `components/NormalMode.jsx`   | `widgets/NormalModeLayout.jsx`               |

## Next Steps

1. Update remaining old component references
2. Consider adding `lib/` to features for utility functions
3. Implement API layer if needed (between features and entities)
4. Add `hooks/` to shared for reusable React hooks
5. Consider state management solution (Zustand, Context)

---

**Reference**: https://feature-sliced.design/
