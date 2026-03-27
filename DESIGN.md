# AstraNavi Design System & Architecture

This document outlines the core design philosophy, styling techniques, animations, and reusable UI components that power the AstraNavi frontend. It serves as a single source of truth for maintaining a consistent, premium aesthetic as the platform scales.

---

## 1. Core Philosophy
AstraNavi blends the 5,000-year-old traditional science of **Vedic Astrology** with **cutting-edge AI precision**. The design reflects this:
- **Premium & Mystical:** Avoiding generic "tech" templates. Utilizing deep purples, golds, rich ivories, and atmospheric blurs.
- **Dynamic but Lightweight:** Highly responsive interactions, hover effects, and cosmic particle animations that fall back gracefully to save user battery and GPU usage.

---

## 2. Theme & Color Architecture
AstraNavi uses **Tailwind CSS v4** combined with semantic CSS variables defined in `src/app/globals.css`. 

### The Palette
We use functional variable names rather than hardcoded hex codes, allowing instant Light/Dark mode switching:
- `--background`: The absolute base layer (Ivory in light, Deep Midnight Purple in dark).
- `--primary`: Main text and bold headings.
- `--secondary`: The "Gold/Lavender" accent used for active states, important buttons, and highlights.
- `--surface` / `--surface-variant`: Used for Cards, Sidebars, and Chat Bubbles to create depth against the background.
- `--on-surface-variant`: Muted text for dates, labels, and secondary information.

---

## 3. Backgrounds & Animations
The background of AstraNavi is deeply dynamic depending on the user's theme.

### Light Mode: "The Ivory Grain"
- **Ivory Pattern:** A subtle CSS-based radial pattern (`.ivory-pattern`) creates a textured, parchment-like feel.
- **Grain Overlay:** A static noise image (`.grain-overlay` at 3% opacity) sits on top to remove digital banding and add an organic, physical texture.

### Dark Mode: "The Cosmic Engine"
- **OGL Particles (`Particles.tsx`):** A custom, WebGL-accelerated 3D particle engine. 
- **Production Optimizations:** 
  - Restricted to `dpr: 1` (Standard Definition) to prevent lag on 4K/Retina displays.
  - Capped at `150` particles using sharp `discard` shaders rather than heavy glowing alphas.
  - Automatically pauses (0% GPU usage) when the user scrolls away, using an `IntersectionObserver`.

### Global Atmosphere
- **Ambient Glows:** Strategically placed `div`s with `blur-[120px]` and low opacity sit behind the application wrapper, providing a soft, spiritual glow that shifts beautifully across both themes.

---

## 4. Layout & Navigation
- **Global Stabilizer:** The `html` tag uses `scrollbar-gutter: stable` to ensure the Navbar never "jumps" horizontally when navigating between short pages and long scrolling pages.
- **Custom Scrollbars:** A globally unified, 5px thin scrollbar. The thumb uses `color-mix` to blend the layout's `--secondary` color with purple variants, maintaining brand consistency across all browsers.
- **The Dashboard Grid:** The Chat interface (`/chat`) uses a fixed viewport (`100vh`) with a responsive CSS Grid (`.chat-layout`). The left sidebar, right panel, and center messaging area are uniquely designed to scroll independently without shifting the entire page.

---

## 5. Reusable UI Components
To prevent code duplication and ensure massive scale without breaking the layout, the UI is broken down into modular React components in `src/components/ui/`:

### Structural Forms
- **`Card.tsx`**: The foundational block for almost all UI. Supports custom padding, hover micro-interactions (`hover:scale`), and bordered variants. It handles its own transparent background logic (`bg-surface/50 backdrop-blur`).
- **`Button.tsx`**: Standardized clickable actions with `primary` and `secondary` variants.

### Specialized Components
- **`ChatBubble.tsx`**: Unifies the User (Ivory) and AI (Lavender) messaging styles. It mathematically handles avatar placement, name tags, width restrictions, and action buttons consistently.
- **`SidebarSectionLabel.tsx`**: Enforces exact typography matching for all sidebar headers ("RECENT CHATS", "TODAY FOR YOU").
- **`TopicPill.tsx`**: Unified interactive "tags" (e.g., "Career & Finance"). Used across multiple panels to guarantee identical hover states.
- **`PricingCard.tsx`**: Condenses heavy feature lists and prices into a single, clean component used primarily on the Home and Plans pages.

---

## Conclusion
By treating the frontend as a modular **Design System** rather than a collection of separate pages, AstraNavi ensures that any design change—like adjusting border radiuses or changing the dark-mode active tint—requires only exactly one line of code modification, instantly applying the update across the entire platform.
