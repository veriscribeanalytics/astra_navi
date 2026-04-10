# Custom React Hooks

Centralized collection of reusable React hooks for the Astranavi application.

## 📦 Installation

All hooks are exported from the main index file:

```typescript
import { useResponsive, useClickOutside, useDebounce } from '@/hooks';
```

---

## 🎨 Animation & Interaction Hooks

### `useVisibilityObserver`

Detects when an element is visible in the viewport using IntersectionObserver.

```typescript
const elementRef = useRef<HTMLDivElement>(null);

useVisibilityObserver(
  elementRef,
  (isVisible) => {
    console.log('Element is visible:', isVisible);
  },
  { threshold: 0.5 }
);
```

**Use cases:** Pause animations when off-screen, lazy loading, analytics tracking

---

### `useResizeObserver`

Observes element size changes using ResizeObserver API.

```typescript
const containerRef = useRef<HTMLDivElement>(null);

useResizeObserver(() => {
  console.log('Container resized!');
}, containerRef);
```

**Use cases:** Responsive canvas sizing, dynamic layouts, chart resizing

---

### `useClickOutside`

Detects clicks outside of specified element(s).

```typescript
const dropdownRef = useRef<HTMLDivElement>(null);

useClickOutside(dropdownRef, () => {
  setIsOpen(false);
});

// Multiple refs
useClickOutside([ref1, ref2], () => {
  console.log('Clicked outside both elements');
});
```

**Use cases:** Close dropdowns, modals, menus, popovers

---

### `useAnimationFrame`

Manages requestAnimationFrame loops with automatic cleanup.

```typescript
useAnimationFrame((deltaTime, elapsedTime) => {
  // deltaTime: time since last frame (ms)
  // elapsedTime: total time since start (ms)
  updateAnimation(deltaTime);
}, isPlaying);
```

**Use cases:** Custom animations, game loops, smooth transitions

---

### `useDebounce`

Debounces a callback function to limit execution frequency.

```typescript
// Debounce callback
useDebounce(
  () => {
    console.log('Debounced!');
  },
  500,
  [searchTerm]
);

// Debounce value
const debouncedSearch = useDebouncedValue(searchTerm, 300);
```

**Use cases:** Search inputs, auto-save, resize handlers

---

### `useMouseMove`

Tracks mouse movement with optional RAF throttling.

```typescript
useMouseMove(
  ({ x, y }) => {
    console.log('Mouse at:', x, y);
  },
  { throttle: true, passive: true }
);
```

**Use cases:** Parallax effects, cursor tracking, interactive backgrounds

---

## 📱 Responsive & Viewport Hooks

### `useMediaQuery`

Tracks CSS media query matches.

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
const isLandscape = useMediaQuery('(orientation: landscape)');
```

**Use cases:** Conditional rendering, responsive logic, feature detection

---

### `useResponsive`

Comprehensive responsive design utilities with Tailwind breakpoints.

```typescript
const { isMobile, isTablet, isDesktop, width, height, breakpoint } = useResponsive();

// Individual device detection
const isMobileDevice = useIsMobileDevice(); // User agent check
const isMobile = useIsMobile(); // Combined check (viewport + user agent)
```

**Breakpoints:**
- `xs`: < 640px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Use cases:** Responsive components, conditional features, layout switching

---

### `useViewport`

Tracks both layout and visual viewport dimensions.

```typescript
const { width, height, visualWidth, visualHeight } = useViewport();

// Detect mobile browser UI visibility
const isBrowserUIVisible = useIsBrowserUIVisible();
```

**Key difference:**
- `width/height`: Layout viewport (includes browser UI)
- `visualWidth/visualHeight`: Visual viewport (excludes browser UI)

**Use cases:** Handle mobile address bar, fixed positioning, full-screen layouts

---

### `useOrientation`

Tracks device orientation changes.

```typescript
const { orientation, angle, isPortrait, isLandscape } = useOrientation();

if (isLandscape) {
  // Show landscape-specific UI
}
```

**Use cases:** Responsive layouts, game controls, media viewers

---

## 🎯 App-Specific Hooks

### `useTheme`

Manages theme switching (light/dark mode).

```typescript
const { theme, toggleTheme, setTheme } = useTheme();
```

---

### `useToast`

Shows toast notifications.

```typescript
const { showToast } = useToast();

showToast('Success!', 'success');
```

---

### `useKeyboardShortcuts`

Registers keyboard shortcuts.

```typescript
useKeyboardShortcuts({
  'Ctrl+S': () => save(),
  'Escape': () => closeModal(),
});
```

---

### `useRealTime`

Real-time data synchronization.

```typescript
const { data, isConnected } = useRealTime('/api/updates');
```

---

## 🔧 Best Practices

1. **Import from index**: Always import from `@/hooks` for consistency
2. **Cleanup is automatic**: All hooks handle cleanup internally
3. **SSR-safe**: Hooks are safe for server-side rendering
4. **TypeScript**: All hooks are fully typed
5. **Performance**: Hooks use refs and memoization where appropriate

---

## 📚 Common Patterns

### Responsive Component

```typescript
function MyComponent() {
  const { isMobile, isDesktop } = useResponsive();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

### Optimized Animation

```typescript
function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  
  useVisibilityObserver(containerRef, setIsVisible);
  
  useAnimationFrame((delta) => {
    if (!isVisible) return; // Skip when off-screen
    updateParticles(delta);
  }, isVisible);
  
  return <div ref={containerRef} />;
}
```

### Dropdown with Click Outside

```typescript
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useClickOutside(dropdownRef, () => setIsOpen(false));
  
  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && <Menu />}
    </div>
  );
}
```

---

## 🚀 Performance Tips

- Use `useVisibilityObserver` to pause expensive animations when off-screen
- Combine `useIsMobile` with `useViewport` for comprehensive mobile detection
- Use `useDebounce` for expensive operations triggered by user input
- Enable `throttle` in `useMouseMove` for smooth performance
- Use `useMediaQuery` instead of inline window.matchMedia calls

---

## 📝 Contributing

When adding new hooks:

1. Create the hook file in `src/hooks/`
2. Add TypeScript types and JSDoc comments
3. Export from `index.ts`
4. Update this README with usage examples
5. Test for SSR compatibility and cleanup
