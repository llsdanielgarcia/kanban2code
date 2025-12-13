---
stage: completed
tags: [feature, ui, mvp, p1]
---

# Task 6.1: Implement Fixed Color Palette

## Goal

Replace VS Code theme-dependent CSS variables with a fixed "Navy Night Gradient" color palette to ensure consistent visual appearance across all VS Code themes.

## Background

Currently the webview uses VS Code's CSS variables which change based on the user's theme. This causes visual inconsistencies and can make the UI look broken in some themes. The design specifies a fixed dark palette that should work regardless of the underlying theme.

## Scope

### CSS Changes
1. Create `src/webview/ui/styles/palette.css` with fixed color variables
2. Override VS Code theme variables with fixed values
3. Apply the Navy Night Gradient background
4. Ensure all components use the fixed palette variables

### Color Palette (from `docs/design/styles/variables.css`)

```css
:root {
  /* Core colors - navy night gradient */
  --k2c-bg-primary: linear-gradient(180deg, #0d111c 0%, #101524 45%, #121829 100%);
  --k2c-bg-secondary: #0c101b;
  --k2c-bg-panel: #161b2b;
  --k2c-border: #2a3147;
  --k2c-text-primary: #f8fafc;
  --k2c-text-secondary: #e2e8f0;
  --k2c-text-muted: #94a3b8;

  /* Interactive */
  --k2c-accent: #3b82f6;
  --k2c-accent-hover: #60a5fa;
  --k2c-button-secondary-bg: #1f273a;
  --k2c-button-secondary-hover: #1e2436;

  /* Input */
  --k2c-input-bg: #1a1f30;
  --k2c-input-border: #2a3247;
  --k2c-input-placeholder: #5d6b85;

  /* Lists */
  --k2c-list-active-bg: rgba(59, 130, 246, 0.16);
  --k2c-list-hover-bg: #1e2436;

  /* Stages */
  --k2c-stage-inbox: #3b82f6;
  --k2c-stage-plan: #5d6b85;
  --k2c-stage-code: #22c55e;
  --k2c-stage-audit: #facc15;
  --k2c-stage-completed: #5d6b85;

  /* Tags */
  --k2c-tag-bug: #ef4444;
  --k2c-tag-feature: #3b82f6;
  --k2c-tag-mvp: #60a5fa;
  --k2c-tag-urgent: #facc15;
  --k2c-tag-idea: #22c55e;
  --k2c-tag-spike: #ef4444;

  /* Scrollbar */
  --k2c-scrollbar: rgba(148, 163, 184, 0.35);
  --k2c-scrollbar-hover: rgba(148, 163, 184, 0.55);
}
```

### Files to Update

1. Create `src/webview/ui/styles/palette.css`
2. Import in `src/webview/ui/styles/main.css`
3. Update component styles to use `--k2c-*` variables
4. Remove theme-dependent variable references

### Testing

- Visual inspection in VS Code light theme
- Visual inspection in VS Code dark theme
- Visual inspection in high contrast theme
- All UI elements should look identical across themes

## Acceptance Criteria

- [x] New `palette.css` file created with fixed colors
- [x] All webview components use fixed palette variables
- [x] UI looks identical in VS Code light, dark, and high contrast themes
- [x] Navy Night Gradient background applied to main containers
- [x] Stage colors consistent and visible
- [x] Tag colors consistent and visible
- [x] Input fields, buttons, and borders all use fixed colors
