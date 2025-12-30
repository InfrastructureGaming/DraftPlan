# MASTER TO-DO LIST

This is a comprehensive to-do list encompassing this entire project. It is designed to be a living document, acting as a kind of "scratch pad" for us to track tasks during working sessions.

This document should be kept updated during programming sessions, and referenced regularly throughout development.

Claude has full permissions to access and modify this document freely as needed.

---

## Current Sprint - In Progress

### 1. 3D Transformation Gizmo Widget
**Goal:** Add visual axis handles for intuitive object manipulation in 3D space

**Status:** Not started
**Priority:** High (Critical UX improvement for 3D manipulation)

**Phase 1 - Move Mode:**
- [ ] Design gizmo appearance (arrows for X/Y/Z axes)
- [ ] Implement axis color coding (X=Red, Y=Green, Z=Blue)
- [ ] Add axis arrow click & drag handlers
- [ ] Implement constrained movement along single axis
- [ ] Add planar movement (click squares between axes)
- [ ] Scale gizmo with zoom for consistent visibility
- [ ] Test in all views (orthographic + isometric)

**Phase 2 - Rotate Mode (Future):**
- [ ] Add rotation rings for each axis
- [ ] Implement rotation angle calculation
- [ ] Add visual feedback during rotation

**Phase 3 - Scale Mode (Future):**
- [ ] Add scale handles at axis endpoints
- [ ] Implement uniform vs non-uniform scaling
- [ ] Add visual feedback during scaling

**Notes:**
- Start with Move mode only - Rotate and Scale are future enhancements
- Standard industry colors for consistency
- Address current issue: 2D mouse movement → 3D transformation is unintuitive
- Visual style TBD, can iterate as we go

---

### 3. Custom Lumber Library
**Goal:** Allow users to add custom lumber items to the library

**Status:** Not started
**Priority:** Medium (Essential feature, but depends on gizmo for good UX)

**Tasks:**
- [ ] Design "Add Custom Lumber" UI/modal
- [ ] Add form fields: Name, Width, Height, Depth (Length), Material
- [ ] Implement storage for custom items (localStorage or project file?)
- [ ] Display custom items in library panel (separate section?)
- [ ] Add edit/delete functionality for custom items
- [ ] Ensure custom items work with all existing features (drag & drop, etc.)

**Data Fields:**
- Name (string)
- Dimensions: Width, Height, Depth (inches, decimal)
- Material (string)
- ~~Pricing~~ (excluded - varies by supplier)

**Notes:**
- Wait until gizmo is complete for better manipulation experience
- Consider: Should custom items be global (all projects) or per-project?

---

## Backlog - Future Features

### UI/UX Improvements
- [ ] Keyboard shortcut reference dialog (Help menu)
- [ ] Annotation tools (text labels, arrows, dimension lines)
- [ ] Manual dimension lines with arrows
- [ ] Improve touch/trackpad gesture support

### Advanced Features
- [ ] Joinery indicators (visual markers for joints)
- [ ] Metric unit support
- [ ] Template library (common projects)
- [ ] Hardware library (screws, hinges, brackets)

### Performance & Polish
- [ ] Object culling for large projects (>500 objects)
- [ ] Implement proper polygon clipping for rotated objects
- [ ] Add loading states for heavy operations
- [ ] Optimize render performance

---

## Recently Completed ✅

### Session: 2024-12-30
- ✅ **Panel Stacking System** - Intelligent panel collapse with space reallocation
  - All three panels (Project Details, Properties, Assemblies) collapsible
  - Collapsed panels take minimal space, expanded panels grow to fill available
  - Centralized collapse state in UIStore for consistency
- ✅ Array Tool implementation (parametric duplication with spacing)
- ✅ Fixed position input bugs in Properties Panel (X/Y/Z editing)
- ✅ View Cube improvements (4 isometric corners, visibility toggle)
- ✅ Made Project Details and Properties panels collapsible
- ✅ Fixed UI spacing issues (no overlapping panels)

### Previous Sessions
- ✅ Multi-project tabs with automatic management
- ✅ Mouse wheel zoom with cursor-centered zooming
- ✅ Recent Projects list in File menu
- ✅ Settings panel with auto-save functionality
- ✅ View Cube with isometric views
- ✅ Rulers with zoom-adaptive grid
- ✅ Alignment tools (align, distribute)
- ✅ Assembly grouping with hierarchical organization
- ✅ Cut list / materials breakdown
- ✅ PDF and PNG export

---

## Known Issues / Bugs

*No critical bugs currently tracked*

---

## Notes & Decisions

**Architecture Decisions:**
- Using Zustand for state management with selector pattern for reactivity
- Electron for cross-platform desktop app
- Three.js for 3D math (orthographic views, not rendering)
- Y-up coordinate system (matches Unreal Engine)

**Design Principles:**
- Focus on woodworking/CAD use case
- Keep UI clean and uncluttered
- Prefer keyboard shortcuts for power users
- Theme support (Light, Dark, Blueprint)

**Development Process:**
- Commit after each major feature completion
- Test thoroughly before moving to next feature
- Use this todo_master.md for task tracking across sessions
- Regular git commits with descriptive messages

---

*Last Updated: 2024-12-30 - Panel Stacking Complete*
