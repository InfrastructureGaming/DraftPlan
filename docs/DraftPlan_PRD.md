# DraftPlan - Product Requirements Document

**Version:** 1.0  
**Date:** December 12, 2024  
**Status:** Ready for Development

---

## Executive Summary

**DraftPlan** is a specialized parametric orthographic CAD application designed specifically for woodworking project planning. Unlike heavyweight 3D modeling software (SketchUp, Fusion 360), DraftPlan provides a streamlined, purpose-built toolset for creating accurate, to-scale plans for furniture, cabinetry, and construction projects.

### Core Value Proposition
- **Fast & Focused:** Stripped-down interface eliminates unnecessary complexity
- **Blueprint Accuracy:** Generate orthographic views with precise dimensions
- **Practical Output:** Export print-ready plans, materials lists, and cut sheets
- **Cross-Platform:** Works on Windows and macOS

### Target User
Home woodworkers, contractors, and DIY builders who need accurate plans without the learning curve of professional CAD software.

---

## Technical Architecture

### Technology Stack
- **Framework:** Electron (cross-platform desktop)
- **UI Layer:** React + Tailwind CSS
- **3D Engine:** Three.js in orthographic mode
  - Provides built-in 3D math, transformations, and projections
  - Orthographic camera for true 2D projection
  - WebGL performance with proper depth sorting
- **PDF Generation:** jsPDF for multi-page export
- **Data Persistence:** Electron Store for settings, JSON files for projects
- **File Format:** `.draftplan` (JSON structure)

### Coordinate System
- **Y-up coordinate system** (matches Unreal Engine convention)
- **Origin point:** Bottom-left corner of Front view (0, 0, 0)
- **Units:** Imperial (inches) with future metric support
- **Precision:** 1/16" minimum increment

### View System
Six orthographic views with axis mapping:
- **Front:** X→screen-X, Y→screen-Y, Z→depth
- **Back:** X→screen-X (flipped), Y→screen-Y, Z→depth (reversed)
- **Left:** Z→screen-X, Y→screen-Y, X→depth
- **Right:** Z→screen-X (flipped), Y→screen-Y, X→depth (reversed)
- **Top:** X→screen-X, Z→screen-Y, Y→depth
- **Bottom:** X→screen-X, Z→screen-Y (flipped), Y→depth (reversed)

### Rendering Pipeline
1. Maintain all objects in 3D space with full coordinate data
2. For current view, project objects onto 2D plane
3. Sort objects by depth (painter's algorithm - back to front)
4. Calculate visible portions (MVP: simple depth sorting; Future: polygon clipping)
5. Render based on display mode (outline/filled/blueprint)

---

## Core Data Structures

### Project File (.draftplan)
```json
{
  "version": "1.0",
  "projectInfo": {
    "name": "Built-in Bookshelf",
    "created": "2024-12-12T10:30:00Z",
    "modified": "2024-12-12T15:45:00Z",
    "notes": "Master bedroom project with crown molding",
    "exteriorDimensions": {
      "width": 96,
      "height": 84,
      "depth": 14
    }
  },
  "objects": [
    {
      "id": "obj-uuid-1",
      "type": "lumber",
      "name": "Left Upright",
      "position": { "x": 0, "y": 0, "z": 0 },
      "dimensions": { "width": 1.5, "height": 84, "depth": 3.5 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "material": "pine",
      "category": "Dimensional Lumber",
      "tags": ["framing", "structural"],
      "gridSnap": true,
      "showDimensions": true,
      "notes": "Pre-drill pocket holes",
      "assemblyId": "asm-uuid-1"
    }
  ],
  "assemblies": [
    {
      "id": "asm-uuid-1",
      "name": "Front Panel",
      "color": "#4A90E2",
      "visible": true,
      "notes": "Assemble frame first, then attach backing",
      "objectIds": ["obj-uuid-1", "obj-uuid-2", "obj-uuid-3"]
    }
  ],
  "annotations": {
    "front": [
      {
        "id": "ann-uuid-1",
        "type": "text",
        "position": { "x": 48, "y": 72 },
        "content": "Pocket holes here",
        "fontSize": 14
      },
      {
        "id": "ann-uuid-2",
        "type": "line",
        "start": { "x": 48, "y": 70 },
        "end": { "x": 48, "y": 42 },
        "style": "solid",
        "arrowStart": false,
        "arrowEnd": true
      }
    ],
    "top": [],
    "left": [],
    "right": [],
    "back": [],
    "bottom": []
  },
  "camera": {
    "currentView": "front",
    "zoom": 1.0,
    "panOffset": { "x": 0, "y": 0 }
  },
  "settings": {
    "gridVisible": true,
    "rulersVisible": true,
    "theme": "light"
  }
}
```

### Lumber Library Item
```json
{
  "id": "lib-2x4-96",
  "nominalName": "2×4",
  "actualDimensions": { "width": 1.5, "height": 3.5, "depth": 96 },
  "material": "pine",
  "category": "Dimensional Lumber",
  "tags": ["framing", "stud", "common"],
  "isCustom": false
}
```

---

## Feature Specifications

### Phase 1: Core 3D Foundation

#### 1.1 Canvas & Grid System
**Requirements:**
- Canvas maintains 11:8.5 aspect ratio (landscape letter paper)
- Zoom-adaptive grid displays appropriate divisions based on zoom level:
  - Far out: 12" divisions
  - Medium: 1" divisions
  - Close: 1/2", 1/4", then 1/16" divisions
- Small text indicator shows current grid size (e.g., "Grid: 1/16"")
- Grid snapping enabled by default, configurable per-object
- Rulers along all four edges aligned to grid, showing measurements
- Background changes with theme (light/dark/blueprint modes)

**Zoom Functionality:**
- Range: 10% to 400%
- Mouse wheel zoom centered on cursor position
- Zoom controls: scroll wheel, +/- buttons, or Ctrl+scroll
- Pan with spacebar+drag or middle mouse button

**Canvas Background Colors:**
- **Light Mode:** Warm-tinted white (#F8F6F0) with light gray grid (#D0D0D0)
- **Dark Mode:** Dark gray (#2A2A2A) with medium gray grid (#505050)
- **Blueprint Mode:** Blueprint blue (#0A2463) with lighter blue grid (#1E3A8A)

#### 1.2 Object Placement & Manipulation
**Drag-and-Drop from Library:**
- Library panel on left side (collapsible)
- Drag lumber item onto canvas to create instance
- Object appears at cursor position, snaps to grid if enabled
- Object automatically selects after placement

**Movement Controls:**
- Click to select object (highlight with selection color)
- Drag selected object to reposition
- Movement constrained to current view's planar axes:
  - **Front view:** X (horizontal), Y (vertical) only
  - **Top view:** X (horizontal), Z (depth) only
  - **Right view:** Z (depth), Y (vertical) only
  - etc.
- Shift+drag to move without grid snap temporarily
- Arrow keys for precise 1-grid-unit movement

**Selection:**
- Click object to select
- Ctrl/Cmd+click to multi-select
- Click-drag empty canvas to box-select multiple objects
- Selected objects show highlight outline
- Delete key removes selected object(s)

#### 1.3 View Switching
**View Controls:**
- Dropdown menu or button group to switch views: Front, Back, Left, Right, Top, Bottom
- Keyboard shortcuts: 1=Front, 2=Back, 3=Left, 4=Right, 5=Top, 6=Bottom
- View name displayed prominently in UI
- Canvas maintains zoom and pan relative to origin when switching views

**3D Object Rendering:**
- Objects rendered as 2D projections in current view
- Depth sorting: objects further from camera render first (painter's algorithm)
- Partially obscured objects rendered correctly (MVP: simple occlusion by depth)
- Display modes:
  - **Outline Mode:** Black/white outlines only, no fill
  - **Filled Mode:** Outlines with light gray fill
  - **Blueprint Mode:** White/light lines on blue background, handwritten-style font

#### 1.4 Properties Panel
**Location:** Docked to right side, collapsible

**Content (when object selected):**
- Object name (editable text field)
- Position: X, Y, Z coordinates (editable, updates in real-time)
- Dimensions: Width, Height, Depth (read-only for library items, editable for custom)
- Rotation: X, Y, Z rotation angles (grayed out until rotation toggle enabled)
- **Grid Snap Toggle:** Enable/disable grid snapping for this object
- **Rotation Toggle:** Enable rotation controls (constrains to whole-degree increments)
- **Show Dimensions Toggle:** Display dimension text on object in canvas
- Material: Dropdown or text field
- Category: Display only (from library)
- Tags: Display only (from library)
- Notes: Multi-line text area for user notes
- Assembly: Dropdown to assign object to assembly

**Content (when no selection):**
- Message: "Select an object to view properties"

**Content (when assembly selected):**
- Assembly name (editable)
- Color picker to change assembly highlight color
- Notes: Multi-line text area
- List of contained objects (clickable to select individual)
- "Ungroup" button to dissolve assembly

#### 1.5 Lumber Library
**Pre-populated Items:**
- **Dimensional Lumber:**
  - 1×3: 0.75" × 2.5" × [96", 120"]
  - 2×3: 1.5" × 2.5" × [96", 120"]
  - 2×4: 1.5" × 3.5" × [96", 120"]
  - 2×6: 1.5" × 5.5" × [96", 120"]
  - 4×4: 3.5" × 3.5" × [96", 120"]
- **Sheet Goods:**
  - Plywood 3/8": 48" × 96" × 0.375"
  - Plywood 1/2": 48" × 96" × 0.5"
  - Plywood 3/4": 48" × 96" × 0.75"

**Library Organization:**
- Main categories visible as expandable sections: "Dimensional Lumber", "Sheet Goods", "Custom Items"
- Each item shows: Nominal name | Actual dimensions
  - Example: "2×4 (1.5" × 3.5" × 96")"
- Search bar at top of library panel
  - Searches by tag across all categories
  - Real-time filtering as user types

**Adding Custom Items:**
- "Add Custom" button at bottom of library
- Dialog prompts for:
  - Name
  - Width, Height, Depth (in inches)
  - Material type (text field)
  - Category (dropdown: same as built-in categories plus "Custom Items")
  - Tags (comma-separated text field)
- Custom items saved globally, appear in library for all projects

#### 1.6 Project Save/Load
**File Operations:**
- **New Project:** Ctrl/Cmd+N - creates blank canvas, prompts for project name
- **Save:** Ctrl/Cmd+S - saves current project as `.draftplan` file
  - If first save, prompts for filename and location
  - Subsequent saves overwrite existing file
- **Save As:** Ctrl/Cmd+Shift+S - prompts for new filename, creates copy
- **Open:** Ctrl/Cmd+O - file picker dialog to load existing project
- **Recent Projects:** File menu shows last 10 opened projects

**Auto-Save:**
- Toggle in Settings: Enable/Disable
- Interval dropdown: 5 min, 15 min, 30 min
- Auto-save creates temporary backup file alongside main project file
- On app launch, check for auto-save backup and prompt recovery if found

**Multi-Project Tabs:**
- Each open project appears as tab at top of canvas area
- Click tab to switch between projects
- Close tab with X button (prompts to save if unsaved changes)
- Maximum 5 open tabs to prevent performance issues

#### 1.7 Undo/Redo System
**Requirements:**
- **Undo:** Ctrl/Cmd+Z - reverts last action
- **Redo:** Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z - reapplies undone action
- History stack maintains last 50 actions
- Actions tracked:
  - Object placement/deletion
  - Object movement
  - Property changes
  - Assembly creation/modification
  - Annotation creation/editing

---

### Phase 2: Visualization & Export

#### 2.1 Display Modes & Themes
**Three Theme Options:**

**Light Mode:**
- Object outlines: Black (#000000)
- Object fill: Dark gray (#808080)
- Text: Black (#000000)
- Background: Warm white (#F8F6F0)
- Grid: Light gray (#D0D0D0)
- Font: Clean sans-serif (Inter, Roboto, or system default)

**Dark Mode:**
- Object outlines: White (#FFFFFF)
- Object fill: Light gray (#B0B0B0)
- Text: White (#FFFFFF)
- Background: Dark gray (#2A2A2A)
- Grid: Medium gray (#505050)
- Font: Same sans-serif

**Blueprint Mode:**
- Object outlines: White (#FFFFFF)
- Object fill: Light gray (#B0B0B0)
- Text: White (#FFFFFF)
- Background: Blueprint blue (#0A2463)
- Grid: Lighter blue (#1E3A8A)
- Font: **Handwritten-style** (Comic Sans MS, or "Architects Daughter" from Google Fonts)

**UI Controls:**
- Theme switcher in toolbar or Settings
- Display mode toggle: Outline / Filled (applies to all themes)
- Settings persist across sessions

#### 2.2 Dimension Display
**Object Dimension Text:**
- Shows visible dimensions only based on current view
  - Front view: Width × Height
  - Top view: Width × Depth
  - Right view: Depth × Height
- Text appears on object surface, positioned near center
- Format: "48.0" × 11.25"" (always include units)
- Font size scales with zoom (readable at all zoom levels)
- Color matches theme (black/white)

**Per-Object Toggle:**
- "Show Dimensions" checkbox in Properties panel
- Default: enabled for new objects

**Global Toggle:**
- Button in toolbar: "Toggle All Dimensions"
- Shows/hides dimension text on all objects simultaneously
- Does not change per-object settings, just overrides display temporarily

#### 2.3 Rulers
**Appearance:**
- Rulers along all four edges of canvas
- Tick marks at grid intervals
- Numbers at major intervals (every 12" or 1', depending on zoom)
- Ruler background matches theme
- Ruler marks and text match theme colors

**Behavior:**
- Scroll with canvas pan
- Scale with zoom
- Always visible (no hide option in MVP)

#### 2.4 Materials Breakdown
**Table Format:**
- Columns: Item | Quantity | X (Width) | Y (Height) | Z (Depth) | Material | Category
- Sortable by any column (click column header)
- Auto-calculates totals (e.g., "Total Pieces: 47")

**Generation:**
- Button in toolbar: "Generate Materials List"
- Analyzes all objects in project
- Groups identical pieces (same dimensions and material)
- Displays in modal dialog or side panel

**Export Options:**
- **CSV Export:** Save table to `.csv` file for spreadsheet import
- **PDF Export:** Include materials list on final page of PDF export

#### 2.5 Image & PDF Export
**Export Dialog:**
- Button in toolbar: "Export Project"
- Dialog shows:
  - **View Selection:** Checkboxes for Front, Back, Left, Right, Top, Bottom
  - **Thumbnail Previews:** Small preview of each selected view
  - **Format:** Radio buttons for Image (PNG) or PDF
  - **Include Materials List:** Checkbox (PDF only)
  - **Include Project Header:** Checkbox (enabled by default)
  - **Page Size:** Dropdown (Letter 8.5×11 in MVP, future: A4, Legal, etc.)

**Project Header (on each page):**
- Project name (large, bold)
- Date of export
- Total exterior dimensions (Width × Height × Depth)
- Part count
- Notes block (user-editable in Project Details panel)

**PDF Generation:**
- Each selected view on separate page (landscape orientation)
- Views rendered at print resolution (150 DPI minimum)
- No scaling - canvas rendered exactly as displayed
- Materials list on final page (if enabled)

**Image Export:**
- Each view saved as separate PNG file
- Filenames: `[ProjectName]_[ViewName].png`
  - Example: `Bookshelf_Front.png`

---

### Phase 3: Advanced Features

#### 3.1 Assembly Grouping
**Creation:**
- Select multiple objects (Ctrl/Cmd+click or box select)
- Click "Create Assembly" button in toolbar
- Dialog prompts for assembly name
- Assembly assigned auto-generated color from standard palette

**Standard Palette (8 colors):**
- Blue: #4A90E2
- Green: #7ED321
- Orange: #F5A623
- Red: #D0021B
- Purple: #9013FE
- Teal: #50E3C2
- Yellow: #F8E71C
- Pink: #FF69B4

**Assemblies Panel:**
- Collapsible panel on left side (below or above Library)
- List view showing all assemblies:
  ```
  📁 Assemblies
    ├─ 👁️ Front Panel (4 objects)
    ├─ 👁️ Left Side (6 objects)  
    └─ 👁️ Back Panel (3 objects)
  ```
- Eye icon: Toggle assembly visibility (hides all contained objects)
- Click name: Select all objects in assembly
- Right-click menu: Edit, Duplicate, Delete

**Visual Indication:**
- Objects in assembly show subtle color tint or thicker outline in assembly color
- Hovering over assembly name highlights all contained objects

**Properties Panel (Assembly Selected):**
- Assembly name (editable)
- Color picker: Select color from standard palette
- Notes field (multi-line)
- List of contained objects (click to select individually)
- "Ungroup" button: Dissolve assembly, keep objects

#### 3.2 Annotation Tools
**Text Annotations:**
- "Add Text" tool button in toolbar
- Click on canvas to place text box
- Type content directly
- Drag to reposition after creation
- Double-click to edit content
- Properties:
  - Font size (default: 14pt)
  - Content (multi-line)
- View-specific: only visible in view where created

**Line Annotations:**
- "Add Line" tool button in toolbar
- Click start point, click end point to place line
- **Snap to Objects:** If click within 10 pixels of object edge/corner, snap to that point
- Properties:
  - Style: Solid, Dashed, Dotted (dropdown in properties)
  - Arrow Start: Checkbox
  - Arrow End: Checkbox
- Drag endpoints to reposition after creation
- View-specific: only visible in view where created

**Annotation Management:**
- Annotations appear in layers list (separate from objects)
- Select annotation to edit properties
- Delete key removes selected annotation

#### 3.3 Rotation System
**Enabling Rotation:**
- "Enable Rotation" toggle in Properties panel (per-object)
- When enabled, rotation controls become active

**Rotation Controls:**
- X, Y, Z rotation angle fields in Properties (0-359 degrees)
- Increment/decrement buttons (±90° quick buttons)
- Manual entry constrained to whole-degree increments (no decimals)

**Visual Feedback:**
- Rotation handles appear on selected object when rotation enabled
- Objects render correctly in all views based on rotation

**Constraint:**
- Rotation defaults to axis-aligned (0°, 90°, 180°, 270°)
- User can enter any whole degree value manually

#### 3.4 Object Duplication & Arrays
**Single Duplication:**
- Ctrl/Cmd+D: Duplicate selected object(s)
- Duplicate appears offset by one grid unit
- Properties remain identical except position

**Array Tool:**
- Select object, click "Create Array" button
- Dialog prompts for:
  - **Direction:** X, Y, or Z axis
  - **Count:** Number of copies (2-100)
  - **Spacing:** Distance between copies (in inches)
  - **Create as Assembly:** Checkbox (groups array items into assembly)
- Preview shows array before confirming
- Click "Create" to generate array

#### 3.5 Manual Dimension Lines
**Creation:**
- "Add Dimension" tool button in toolbar
- Click first point, click second point
- Dimension line appears with auto-calculated distance

**Properties:**
- Distance (auto-calculated, read-only by default)
- "Override Text" checkbox: Allows custom text instead of calculated distance
- Line offset: Distance from objects (adjustable)
- Text position: Above/below line (toggle)

**Visual Style:**
- Lines with extension marks and arrows at endpoints
- Text centered on line
- Matches theme colors

---

### Phase 4: Polish & Power Features

#### 4.1 Metric Support
**Settings Option:**
- "Units" dropdown in Settings: Imperial / Metric
- Affects all dimension displays globally
- Conversions applied in real-time

**Display Changes:**
- Imperial: inches (") and feet (') notation
- Metric: millimeters (mm) and meters (m) notation
- Library shows both nominal and actual dimensions in selected units

#### 4.2 Joinery Indicators
**Visual System:**
- Select two objects, click "Add Joint"
- Click location on first object where joint occurs
- Joint type dropdown: Butt, Pocket Hole, Dado, Mortise & Tenon, Dowel, Biscuit
- Icon appears at joint location
- Color-coded by joint type

**Joint Properties (in Properties panel when joint selected):**
- Joint type
- Connected objects (read-only list)
- Location (X, Y, Z)
- Notes field
- Delete button

#### 4.3 Advanced Occlusion
**Polygon Clipping:**
- For rotated objects, implement proper polygon intersection
- Calculate visible portions of each object based on all objects in front
- Render only visible portions (more accurate than depth sorting alone)

#### 4.4 Keyboard Shortcuts Reference
**Essential Shortcuts:**
- **Ctrl/Cmd+N:** New Project
- **Ctrl/Cmd+O:** Open Project
- **Ctrl/Cmd+S:** Save
- **Ctrl/Cmd+Shift+S:** Save As
- **Ctrl/Cmd+Z:** Undo
- **Ctrl/Cmd+Y:** Redo
- **Ctrl/Cmd+D:** Duplicate
- **Delete:** Remove selected object(s)
- **1-6:** Switch views (Front, Back, Left, Right, Top, Bottom)
- **Spacebar+Drag:** Pan canvas
- **Ctrl/Cmd+Scroll:** Zoom
- **Arrow Keys:** Move selected object(s) by one grid unit

**Help Dialog:**
- "Keyboard Shortcuts" in Help menu
- Shows all shortcuts in categorized table

---

## User Interface Layout

### Main Window Structure
```
┌─────────────────────────────────────────────────────────────────┐
│  Menu Bar: File | Edit | View | Tools | Help                    │
├─────────────────────────────────────────────────────────────────┤
│  Toolbar: [Theme] [Grid] [Snap] [Dimensions] [Export] [...]     │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────┬───────────────────────────────────────┬──────────┐ │
│ │          │  Canvas Area (11:8.5 ratio)          │          │ │
│ │ Library  │  ┌──────────────────────────────────┐ │Properties│ │
│ │ Panel    │  │ Rulers (top & left)              │ │ Panel    │ │
│ │          │  │ ┌──────────────────────────────┐ │ │          │ │
│ │ [Search] │  │ │                              │ │ │ [Name]   │ │
│ │          │  │ │                              │ │ │ [X,Y,Z]  │ │
│ │ ▼Dim.    │  │ │       Canvas                 │ │ │ [Dims]   │ │
│ │  Lumber  │  │ │                              │ │ │ [Rot]    │ │
│ │  -2×4    │  │ │                              │ │ │ [Snaps]  │ │
│ │  -2×6    │  │ │                              │ │ │ [Notes]  │ │
│ │ ▼Sheet   │  │ │                              │ │ │          │ │
│ │  Goods   │  │ │                              │ │ │          │ │
│ │  -Ply    │  │ │                              │ │ │          │ │
│ │          │  │ │                              │ │ │          │ │
│ │          │  │ └──────────────────────────────┘ │ │          │ │
│ │ ▼Assem.  │  │ Rulers (bottom & right)          │ │          │ │
│ │  -Front  │  └──────────────────────────────────┘ │          │ │
│ │   Panel  │  Tabs: [Bookshelf] [Table] [+]       │          │ │
│ │          │                                       │          │ │
│ └──────────┴───────────────────────────────────────┴──────────┘ │
│  Status Bar: View: Front | Zoom: 100% | Grid: 1/4" | Coords   │
└─────────────────────────────────────────────────────────────────┘
```

### Panel Collapse Behavior
- All panels (Library, Assemblies, Properties, Project Details) have collapse/expand buttons
- Collapsed panels show only narrow bar with icon
- Keyboard shortcut to toggle each panel (configurable)

---

## Project Details Panel

**Location:** Separate collapsible panel (top-left or docked with Library)

**Content:**
- **Project Name:** Editable text field
- **Created Date:** Read-only, auto-populated
- **Modified Date:** Read-only, auto-updates on save
- **Exterior Dimensions:** Auto-calculated bounding box, or user-override
  - Width (X): Input field
  - Height (Y): Input field
  - Depth (Z): Input field
- **Part Count:** Read-only, auto-calculated from objects
- **Notes:** Multi-line text area for project description
  - Example: "Master bedroom built-in bookshelf with crown molding and adjustable shelves"

**Usage:**
- Information appears in project header on export
- Helps organize and document projects

---

## Settings Panel

**Access:** File > Settings or Preferences (platform-dependent naming)

**Sections:**

### General
- **Units:** Dropdown (Imperial / Metric)
- **Theme:** Dropdown (Light / Dark / Blueprint)
- **Auto-Save:** 
  - Enable/Disable toggle
  - Interval dropdown (5 min / 15 min / 30 min)

### Display
- **Grid Visible:** Checkbox (default: on)
- **Rulers Visible:** Checkbox (default: on)
- **Dimension Text Visible:** Checkbox (default: on)
- **Default Display Mode:** Dropdown (Outline / Filled)

### Keyboard Shortcuts
- Table showing all shortcuts with ability to customize (Phase 4 feature)

---

## Success Criteria

### Phase 1 Completion
- [ ] User can create new project
- [ ] User can place objects from library onto canvas
- [ ] User can move objects in current view
- [ ] User can switch between all six views
- [ ] Objects render correctly with depth sorting
- [ ] Properties panel shows/edits object properties
- [ ] User can save and load projects
- [ ] Undo/redo functions correctly
- [ ] Grid snapping works
- [ ] Zoom and pan work smoothly

### Phase 2 Completion
- [ ] Three themes implemented (Light/Dark/Blueprint)
- [ ] Dimension text displays correctly on objects
- [ ] Rulers show and update with zoom/pan
- [ ] Materials breakdown generates correctly
- [ ] Export to PDF with multiple views works
- [ ] Export to PNG works
- [ ] Project header appears on exports

### Phase 3 Completion
- [ ] Assembly grouping creates and manages assemblies
- [ ] Assemblies panel shows/toggles visibility
- [ ] Text annotations can be placed and edited
- [ ] Line annotations with arrows and snapping work
- [ ] Rotation can be enabled and applied to objects
- [ ] Object duplication works
- [ ] Array tool creates evenly-spaced copies

### Phase 4 Completion
- [ ] Metric units support implemented
- [ ] Joinery indicators can be placed and edited
- [ ] Advanced occlusion rendering (if needed)
- [ ] Keyboard shortcuts reference available

---

## Known Constraints & Limitations

### MVP Scope
- **Axis-aligned only** by default (rotation must be explicitly enabled)
- **Simple depth sorting** for occlusion (Phase 1)
- **Imperial units only** initially (metric in Phase 4)
- **Letter size paper** only for export (other sizes future feature)
- **Basic library** (expandable by user)

### Performance Considerations
- Limit to ~500 objects per project for smooth performance
- Limit to 5 open project tabs simultaneously
- Large assemblies (>50 objects) may impact view switching speed

### Future Enhancements (Post-Phase 4)
- Cloud sync for projects
- Collaborative editing
- Template library (common projects)
- 3D perspective view (isometric or free camera)
- Animation/assembly sequence planning
- Integration with CNC/laser cutter toolpaths
- Mobile companion app (view-only)
- Material cost estimation
- Hardware library (screws, hinges, brackets)

---

## Development Notes

### Testing Strategy
- **Unit tests:** Core 3D math functions (projection, rotation, collision)
- **Integration tests:** Save/load, export, undo/redo
- **Manual testing:** UI interactions, theme switching, real-world projects

### Performance Optimization
- Implement object culling (don't render off-screen objects)
- Cache rendered frames when nothing changes
- Debounce property updates during drag operations
- Use requestAnimationFrame for smooth animations

### Accessibility Considerations
- Keyboard navigation for all tools
- High contrast mode option
- Tooltips on all toolbar buttons
- Screen reader compatibility (label all interactive elements)

### Cross-Platform Considerations
- Test on both Windows and macOS
- Platform-specific keyboard shortcuts (Ctrl vs Cmd)
- File path handling (Windows backslashes vs Unix forward slashes)
- Native file dialogs on each platform

---

## Appendix: Example Projects

### Example 1: Simple Bookshelf
- 4× vertical supports (2×4 × 72")
- 6× horizontal shelves (1×12 × 36")
- 2× side panels (plywood 1/2" × 12" × 72")
- Views needed: Front, Left, Top
- Assembly: Front Panel, Left Side, Right Side

### Example 2: Picture Frame
- 4× frame pieces (1×3 with mitered corners)
- 1× backing (plywood 1/8")
- 1× glass (custom dimensions)
- Views needed: Front, Right (to show depth)
- Annotations: Joint locations, glass size

### Example 3: Built-in Cabinet
- Multiple assemblies: Face Frame, Carcass, Shelves, Doors
- Complex joinery: Pocket holes, dados, hinges
- Detailed materials list for lumber yard
- All six views needed for comprehensive plans

---

## Glossary

- **Orthographic Projection:** 2D representation of 3D object without perspective distortion
- **Painter's Algorithm:** Rendering technique that sorts objects by depth
- **Axis-Aligned:** Objects aligned to X, Y, Z axes (no rotation)
- **Grid Snapping:** Constraining object movement to grid intersections
- **Nominal Dimensions:** Traditional lumber size names (e.g., "2×4")
- **Actual Dimensions:** True measured size of lumber (e.g., 1.5" × 3.5")
- **Assembly:** Grouping of multiple objects treated as single unit
- **Bounding Box:** Smallest box that contains all objects in project

---

## Document Control

**Revision History:**
- v1.0 (2024-12-12): Initial PRD - Jack O'Neill & Claude

**Approval:**
- Product Owner: Jack O'Neill
- Development: Claude Code

**Next Steps:**
1. Review and approve PRD
2. Create Phase 1 implementation plan
3. Set up project repository
4. Begin development with Claude Code

---

*End of Product Requirements Document*
