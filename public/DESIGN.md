# Design System Document: Chromatic Editorial

## 1. Overview & Creative North Star
### The Creative North Star: "The Neon Curator"
This design system is a rejection of the "generic SaaS" aesthetic. It moves away from sterile white grids and thin grey lines, instead embracing **Organic Editorialism**. By combining the deep, atmospheric purples and teals of a high-end botanical gallery with the bold, high-contrast typography of a modern editorial magazine, we create an experience that feels curated rather than generated.

**The Design Philosophy:**
*   **Intentional Asymmetry:** Layouts should feel like a magazine spread. Use overlapping elements and varied card sizes to break the "row-after-row" monotony.
*   **Atmospheric Depth:** Depth is not created by lines, but by light and shadow. We use the "glow" of vibrant accents to guide the eye.
*   **Typography as Hero:** Text isn't just for reading; it’s a visual anchor. High-scale headings provide the structural "bones" that allow the rest of the UI to breathe.

---

## 2. Colors
Our palette is rooted in a deep, nocturnal base (`background: #0d0d15`) punctuated by electric teals (`secondary: #5ffae6`) and punchy magenta-pinks (`tertiary: #ff6c95`).

### The Palette Logic
*   **Primary (`#a8a4ff`):** Use for brand-heavy moments and soft focal points.
*   **Secondary (`#5ffae6`):** Reserved for "interactive sparks"—success states, primary CTAs, and hover highlights.
*   **Tertiary (`#ff6c95`):** Use for attention-grabbing accents and "vibrant breaks" in the dark theme.

### The "No-Line" Rule
**Borders are strictly prohibited for sectioning.** To separate content, use background shifts. 
*   *Example:* A `surface-container-low` section sitting on a `surface` background provides all the definition a user needs. If you feel the urge to draw a line, increase the spacing (`spacing-8`) instead.

### Signature Textures: Glass & Gradient
To achieve the high-end look of our reference imagery, main CTAs should utilize a subtle linear gradient:
*   **Primary Gradient:** `primary` (`#a8a4ff`) to `primary-dim` (`#675df9`).
*   **Glassmorphism:** For floating menus or overlays, use `surface-variant` at 60% opacity with a `20px` backdrop-blur. This allows the vibrant brand colors to "bleed" through the interface, creating a sense of unity.

---

## 3. Typography
We use a high-contrast pairing: **Epilogue** for authoritative headlines and **Manrope** for functional, elegant body text.

| Role | Token | Font | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Epilogue | 3.5rem | High-impact hero statements. Bold weight. |
| **Headline** | `headline-lg` | Epilogue | 2rem | Section headers. Use to anchor card layouts. |
| **Title** | `title-md` | Manrope | 1.125rem | Card headings and navigational elements. |
| **Body** | `body-lg` | Manrope | 1rem | Long-form reading. High legibility. |
| **Label** | `label-md` | Manrope | 0.75rem | Metadata, caps-styling recommended. |

**Editorial Note:** Always prioritize whitespace over font size. A `display-md` heading with `spacing-12` of top-margin creates more "premium" authority than a larger font with tight margins.

---

## 4. Elevation & Depth
Depth in this system is "Tonal," not "Structural."

*   **The Layering Principle:** Stack surfaces to create hierarchy. 
    *   *Base:* `surface` (`#0d0d15`)
    *   *Mid-Level (Sections):* `surface-container-low` (`#13131b`)
    *   *High-Level (Cards):* `surface-container-highest` (`#252530`)
*   **Ambient Shadows:** For "FUN" or interactive cards, use a tinted shadow. Instead of black, use `primary` at 10% opacity with a `48px` blur. This creates a "glow" effect rather than a "drop" effect, mimicking the vibrant lighting in our reference images.
*   **The Ghost Border Fallback:** If accessibility requires a container edge, use `outline-variant` (`#484750`) at 20% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-dim`), `on-primary` text, `rounded-full`.
*   **Secondary:** Ghost style. `outline` border at 30% opacity, `secondary` text.
*   **Interactive State:** On hover, apply a `secondary` (`#5ffae6`) outer glow (8px blur).

### Editorial Cards
Inspired by the "FUN" layout in our references, cards must be borderless.
*   **Background:** `surface-container`
*   **Corner Radius:** `rounded-lg` (1rem).
*   **Interaction:** On hover, the card should lift using a `primary` glow and scale slightly (1.02x).

### Chips & Badges
*   **Style:** Pill-shaped (`rounded-full`).
*   **Color:** Use `secondary-container` with `on-secondary-container` text for a subtle, high-end "teal-on-dark" look.

### Input Fields
*   **Surface:** `surface-container-highest`.
*   **Active State:** No heavy border; instead, use a 2px bottom-bar of `secondary` and a subtle `secondary` glow.

---

## 6. Do's and Don'ts

### Do
*   **DO** use asymmetric spacing. If the left margin is `spacing-8`, try a `spacing-12` right margin for an editorial feel.
*   **DO** overlap images with text blocks. Use `z-index` to let `display-lg` typography sit halfway over a `rounded-lg` image container.
*   **DO** use the `secondary` teal for all success/active states to maintain the "Neon Curator" vibe.

### Don't
*   **DON'T** use 1px solid white or grey borders. This immediately flattens the design and ruins the atmospheric depth.
*   **DON'T** use pure black for shadows. It muddies the vibrant purples. Always tint your shadows with the `primary` or `surface-tint` tokens.
*   **DON'T** crowd the layout. If a screen feels busy, remove a container background and use vertical whitespace (`spacing-16` or higher) to define the change in context.