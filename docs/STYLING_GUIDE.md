# TrangVang Styling Guide

This document outlines the styling guidelines for TrangVang's Perplexica interface, ensuring consistent colors and typography.

## Typography

### Font Family
- **Primary Font**: `Roboto` (Google Fonts)
- **Fallback**: `Arial, sans-serif`
- **CSS Variable**: `--font-sans`

### Font Weights
- **300**: Light
- **400**: Regular (Normal)
- **500**: Medium
- **700**: Bold

### Font Sizes

#### Headings
- **H1**: 
  - Desktop: `2.5rem` (40px) / `font-weight: 700`
  - Tablet: `2rem` (32px)
  - Mobile: `1.75rem` (28px)
- **H2**: 
  - Desktop: `1.875rem` (30px) / `font-weight: 600`
  - Tablet: `1.5rem` (24px)
  - Mobile: `1.375rem` (22px)
- **H3**: 
  - Desktop: `1.5rem` (24px) / `font-weight: 600`
  - Tablet: `1.25rem` (20px)
  - Mobile: `1.125rem` (18px)

#### Body Text
- **Large**: `1.125rem` (18px) - for blog content
- **Normal**: `1rem` (16px) - default
- **Small**: `0.875rem` (14px)
- **Extra Small**: `0.75rem` (12px)

### Line Height
- **Headings**: `1.2 - 1.4`
- **Body**: `1.7` (for blog content), `1.5` (default)

---

## Color System

### Theme Philosophy
TrangVang uses a **Yellow Pages-inspired theme** with yellow and black as primary colors, creating a familiar and professional look.

### Available Colors

#### CSS Variables (Light Theme)
All colors are defined using OKLCH color space for consistency:

```css
--background: oklch(0.98 0.05 95);        /* Soft cream paper */
--foreground: oklch(0.15 0 0);            /* Near-black text */
--primary: oklch(0.15 0 0);               /* Black primary */
--primary-foreground: oklch(0.96 0.12 95); /* Yellow text/icon on primary */
--secondary: oklch(0.965 0.06 95);        /* Pale yellow */
--muted: oklch(0.96 0.04 95);             /* Subtle cream */
--accent: oklch(0.86 0.18 85);            /* Amber accent */
--destructive: oklch(0.57 0.25 27.3);     /* Red for errors */
--border: oklch(0.92 0.05 95);            /* Light yellow border */
--ring: oklch(0.78 0.18 85);              /* Amber focus ring */
--card: oklch(1 0 0);                     /* White cards */
```

#### Tailwind Utility Classes

##### Theme Colors
```tsx
// Background and foreground
bg-background text-foreground

// Primary colors
bg-primary text-primary-foreground
bg-secondary text-secondary-foreground

// Muted colors
bg-muted text-muted-foreground

// Accent colors
bg-accent text-accent-foreground

// Destructive colors
bg-destructive text-destructive-foreground

// Border and input
border-border
bg-input

// Card colors
bg-card text-card-foreground

// Focus ring
ring-ring
```

##### Brand Yellow Colors
```tsx
// Yellow variants
bg-yellow-50   // Very light yellow
bg-yellow-100   // Subtle backgrounds
bg-yellow-200   // Light yellow
bg-yellow-300   // Hover states
bg-yellow-400   // Primary brand yellow (#facc15)
bg-yellow-500   // Standard yellow
bg-yellow-600   // Hover text colors
bg-yellow-700   // Badge text
bg-yellow-800   // Dark yellow
bg-yellow-900   // Darkest yellow
```

---

## Usage Guidelines

### Buttons

#### Primary CTA Button
```tsx
<button className="bg-black text-yellow-400 hover:bg-gray-900">
  Click Me
</button>
```

#### Secondary Button
```tsx
<button className="bg-yellow-400 text-black hover:bg-yellow-300">
  Secondary Action
</button>
```

#### Outline Button
```tsx
<button className="border border-black text-black hover:bg-yellow-100">
  Outline
</button>
```

### Badges & Tags
```tsx
<span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
  New
</span>
```

### Cards
```tsx
<div className="bg-card text-card-foreground border border-border rounded-lg p-4">
  Content
</div>
```

### Icons
```tsx
// Primary icon
<Icon className="text-black" />

// Icon on yellow background
<Icon className="text-black" />

// Icon on black background
<Icon className="text-yellow-400" />
```

### Form Inputs
```tsx
<input 
  className="bg-input border-border text-foreground focus:ring-ring" 
  type="text" 
/>
```

---

## Implementation

### Typography
Typography is automatically applied via global CSS in `src/app/globals.css`. The font is configured in `src/app/layout.tsx`.

### Colors
Colors are available through:
1. **CSS Variables**: Defined in `globals.css`
2. **Tailwind Classes**: Configured in `tailwind.config.ts`

### Dark Mode
Dark mode support is maintained with separate color variables defined under `.dark` class.

---

## Best Practices

1. **Consistency**: Always use the defined color tokens instead of custom colors
2. **Contrast**: Ensure sufficient contrast between text and background colors
3. **Brand Identity**: Use yellow (#facc15) sparingly for accents and CTAs
4. **Typography**: Use semantic HTML headings (h1, h2, h3) to automatically get correct sizing
5. **Accessibility**: Test color combinations for WCAG AA compliance

