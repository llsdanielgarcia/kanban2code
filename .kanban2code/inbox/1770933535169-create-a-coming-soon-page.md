---
stage: code
agent: 05-⚙️coder
tags: []
contexts:
  - architecture
  - ai-guide
skills: []
attempts: 2
provider: opus
---

# Create a coming soon page

I need a coming soon page, something modern

## Refined Prompt
Objective: Create a modern glassmorphic "Coming Soon" landing page for the Kanban2Code VS Code extension. 

Implementation approach:
1. Create `docs/design/coming-soon2.html` as a standalone HTML file
2. Link existing stylesheets: `variables.css`, `glassmorphic.css`, `components.css`
3. Build hero section with logo, headline, tagline, and animated "Coming Soon" badge
4. Create feature teaser grid with 6 glassmorphic cards
5. Add visual preview section with mockup/screenshot placeholder
6. Include call-to-action section with email signup placeholder and GitHub link
7. Add footer with version and copyright

Key decisions:
- Use existing glassmorphic design system: No new CSS files needed, inline styles for page-specific elements
- Feature cards will use existing `.glass` and `.glass-card` classes
- Animations: CSS-only pulse effect on badge, hover transitions on cards

Edge cases:
- Backdrop-filter fallback for older browsers: Add solid color fallback before blur
- Responsive layout: Feature cards stack on mobile using CSS Grid auto-fill

## Context
### Relevant Code
- `docs/design/styles/glassmorphic.css:1-195` - Glass effects, stage colors, hover states
- `docs/design/styles/variables.css:1-117` - CSS custom properties for colors, spacing, typography
- `docs/design/styles/components.css` - Base component styles (buttons, inputs, tags)
- `docs/design/index.html:1-499` - Reference for page structure and card grid pattern

### Patterns to Follow
- Use `.glass` class for main containers
- Use `.glass-card` for feature cards
- Follow existing color variables: `--vscode-*` and `--stage-*`
- Use CSS Grid with `auto-fill, minmax(280px, 1fr)` for responsive card grids
- Include hover transform effect: `translateY(-4px)` with box-shadow

### Test Patterns
- Visual testing in browser - open HTML file directly
- Test responsive by resizing browser window
- Check backdrop-filter support in different browsers

### Dependencies
- Existing CSS files in `docs/design/styles/` - no new dependencies needed

### Gotchas
- Backdrop-filter requires webkit prefix for Safari: `-webkit-backdrop-filter`
- Glassmorphic effects need semi-transparent backgrounds to work properly
- Stage colors are defined with opacity variants for backgrounds and borders

## Page Structure

### Hero Section
- Kanban2Code logo (SVG grid icon from existing design)
- Main headline: "Kanban2Code"
- Tagline: "AI-Powered Task Management for VS Code"
- "Coming Soon" badge with pulse animation

### Feature Teasers (6 cards)
1. **File-Based Kanban** - Tasks live in your filesystem, not a database
2. **AI Context Builder** - Structured prompts for AI-assisted development
3. **Stage Workflow** - Inbox → Plan → Code → Audit → Completed
4. **Smart Sidebar** - Quick views, filters, and keyboard navigation
5. **Agent System** - Specialized AI agents for different task types
6. **Runner Automation** - Automated batch processing for AI workflows

### Visual Preview Section
- Placeholder for screenshot or animated mockup
- Glassmorphic frame styling

### Call-to-Action Section
- Email input with "Get Notified" button (placeholder functionality)
- Link to GitHub repository

### Footer
- Version info
- Copyright
- Links to documentation

## Files to Create
| File | Description |
|------|-------------|
| `docs/design/coming-soon.html` | Main landing page with all sections | 

## Review

**Rating: 9/10**

**Verdict: ACCEPTED**

### Summary
The implementation delivers a polished, modern glassmorphic coming-soon page and matches the requested structure and styling constraints. The page is responsive, uses the shared design system, and includes all required sections.

### Findings

#### Blockers
- [ ] None.

#### High Priority
- [ ] None.

#### Medium Priority
- [ ] [Repository link placeholder]: The GitHub CTA points to `https://github.com` instead of the project repository URL. - `docs/design/coming-soon.html:379`

#### Low Priority / Nits
- [ ] [Placeholder form behavior]: Signup form intentionally does not submit (`onsubmit="return false;"`), which is acceptable for now but should be wired when backend/endpoint is ready. - `docs/design/coming-soon.html:373`

### Test Assessment
- Coverage: Adequate
- Missing tests: No automated tests required for this static design file; manual visual verification across viewport sizes is the remaining check.

### What's Good
- Strong visual hierarchy and atmosphere with gradient background and glassmorphic sections.
- All requested sections are present: hero, 6-card features grid, preview placeholder, CTA, and footer.
- Correct reuse of shared stylesheets and classes (`.glass`, `.glass-card`, `.glass-input`, `.glass-button`) with sensible page-local overrides.
- Responsive behavior and backdrop-filter fallback are implemented as requested.

### Recommendations
- Replace the generic GitHub URL with the canonical Kanban2Code repository URL before launch.
