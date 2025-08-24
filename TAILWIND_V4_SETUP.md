# Tailwind CSS v4 Setup Guide

## Current Setup ✅

This project is configured with **Tailwind CSS v4.1.12** - the latest version with modern features.

## Installation

```bash
# Already installed, but for reference:
bun add -D tailwindcss @tailwindcss/postcss autoprefixer
```

## Configuration Files

### 1. `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom animations
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-reverse': 'spin-reverse 3s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      // Custom colors
      colors: {
        'magic': {
          purple: '#8b5cf6',
          pink: '#ec4899',
          cyan: '#06b6d4',
          orange: '#ff6b35',
        }
      },
      // Custom gradients
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-magic': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config
```

### 2. `postcss.config.mjs`
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // Tailwind v4 uses @tailwindcss/postcss
  },
}
```

### 3. `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Key Differences in Tailwind v4

### 1. **PostCSS Plugin Change**
- v3: Used `tailwindcss` as PostCSS plugin
- v4: Uses `@tailwindcss/postcss` package

### 2. **TypeScript Support**
- Full TypeScript support with `Config` type
- Use `.ts` extension for config file
- Type-safe configuration with `satisfies Config`

### 3. **Performance Improvements**
- Faster build times
- Smaller CSS output
- Better tree-shaking

### 4. **New Features**
- Container queries support
- Enhanced gradient utilities
- Improved dark mode support
- Better animation utilities

## Usage Examples

### Custom Colors
```jsx
<div className="bg-magic-purple text-magic-cyan">
  Magic Colors!
</div>
```

### Custom Animations
```jsx
<div className="animate-float">
  Floating element
</div>

<div className="animate-spin-reverse">
  Reverse spinning
</div>
```

### Gradients
```jsx
<div className="bg-gradient-magic">
  Magic gradient background
</div>
```

## Development Commands

```bash
# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Troubleshooting

### Issue: PostCSS Error
**Solution**: Make sure you're using `@tailwindcss/postcss` not `tailwindcss` in PostCSS config.

### Issue: Types not working
**Solution**: Ensure `tailwind.config.ts` uses TypeScript and imports `Config` type.

### Issue: Styles not applying
**Solution**: Check that your CSS file imports Tailwind directives and content paths are correct.

## VSCode Extensions

Recommended extensions for better Tailwind v4 experience:
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **PostCSS Language Support** - Syntax highlighting

## Resources

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Playground](https://play.tailwindcss.com)

## Project-Specific Setup

This project uses Tailwind v4 for:
- ✨ Magic particle effects styling
- 🎨 Gradient backgrounds
- 🎮 Control panel UI
- 📱 Responsive design
- 🌈 Custom animations for spells

All components are built with Tailwind utility classes for consistent styling and easy maintenance.