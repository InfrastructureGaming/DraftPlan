# MASTER TO-DO LIST

This is a comprehensive to-do list encompassing this entire project. It is designed to be a living document, acting as a kind of "scratch pad" for us to track tasks during working sessions.

This document should be kept updated during programming sessions, and referenced regularly throughout development.

Claude has full permissions to access and modify this document freely as needed.

---

## Current Sprint - In Progress

### 1. 3D Transformation Gizmo Widget
**Goal:** Add visual axis handles for intuitive object manipulation in 3D space

**Status:** ✅ Complete (Phase 1)
**Priority:** High (Critical UX improvement for 3D manipulation)

**Phase 1 - Move Mode:**
- [x] Create TransformGizmo component with SVG rendering
- [x] Position gizmo at selected object's world position
- [x] Draw three axis arrows (X=Red, Y=Green, Z=Blue)
- [x] Implement click detection for each axis
- [x] Handle drag along constrained axis (single axis movement)
- [x] Add real-time numerical feedback during drag (+X.XX")
- [x] Scale gizmo with zoom for consistent visibility
- [x] Add gizmo visibility toggle to View menu
- [x] Fix coordinate transformation for smooth, flicker-free dragging
- [x] Test in all views (orthographic + isometric)
- [ ] Add planar movement squares (XY, XZ, YZ planes) - Future enhancement

**Phase 2 - Settings (Optional enhancement):**
- [ ] Add "Gizmo Scale" slider in Settings panel

**Phase 3 - Rotate Mode (Future):**
- [ ] Add rotation rings for each axis
- [ ] Implement rotation angle calculation
- [ ] Add visual feedback during rotation

**Phase 4 - Scale Mode (Future):**
- [ ] Add scale handles at axis endpoints
- [ ] Implement uniform vs non-uniform scaling
- [ ] Add visual feedback during scaling

**Design Decisions:**
- Gizmo appears automatically when object is selected ✅
- Real-time numerical feedback during drag (+/-X.XX") ✅
- Standard industry colors (X=Red, Y=Green, Z=Blue) ✅
- Gizmo scale TBD, will add settings slider if needed ✅
- SVG-based rendering for consistency with existing architecture

**Notes:**
- Start with Move mode only - Rotate and Scale are future enhancements
- Address current issue: 2D mouse movement → 3D transformation is unintuitive
- Will likely hit auto-compact during implementation (todo_master.md survives!)

---

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
- ✅ **Dimension Line Annotation Tool** - Precise measurement annotations in 3D space
  - Two-click creation workflow: click start point, then end point
  - Automatic distance calculation displayed in inches with decimal precision
  - SVG-based rendering with arrows and endpoint markers
  - "Dimension" toggle button (📏) in Canvas Controls
  - Theme-aware colors (white for dark/blueprint, black for light)
  - Text labels with background for readability
  - Escape key to cancel dimension line mode
  - Full integration with project save/load and undo/redo
  - Works in all orthographic and isometric views
  - Future: Edit endpoints, delete lines, custom labels
- ✅ **Custom Lumber Library** - Add, edit, and manage custom lumber items
  - "+ Custom" button in Library panel for adding custom items
  - AddCustomLumberModal with form fields for Name, Dimensions, Material, Category
  - customLumberStore for localStorage persistence (survives app restart)
  - Edit/delete buttons appear on hover for custom items
  - Custom items display "Custom" badge for easy identification
  - Custom items fully integrated with drag & drop and all existing features
  - Items grouped by category alongside standard library items
- ✅ **3D Transformation Gizmo** - Visual axis handles for precise object manipulation
  - Industry-standard color coding (X=Red, Y=Green, Z=Blue)
  - Constrained single-axis dragging with real-time numerical feedback
  - Smooth, flicker-free performance using local position deltas
  - Gizmo stays locked to object during pan/zoom operations
  - View-aware axis visibility (only shows relevant axes)
  - Visibility toggle in View menu
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

*Last Updated: 2024-12-31 - Dimension Line Annotation Tool Complete*
