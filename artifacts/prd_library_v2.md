# PRD: Digital FlipBoard Library Section (v2.0)

## 1. Overview
The Library section is the central repository for users to store, organize, and manage their custom board designs. It transitions the app from a "one-off" message tool to a durable content management system for digital signage.

## 2. Target Audience
- **Pro Users**: Business owners managing multiple boards.
- **Creative Users**: Designers creating complex layouts.
- **Casual Users**: People who want to save favorite messages for quick reuse.

## 3. Current Functionality (v1.0)
- Save current board state with a name.
- List saved designs (Grid/List view).
- Search designs by name.
- Load design to active board.
- Delete design.

## 4. Proposed "Senior" Features (v2.0)

### 4.1 Collections & Organization
- **Folders/Collections**: Users can create named collections (e.g., "Morning Specials", "Event: Wedding").
- **Drag-and-Drop**: Move designs between collections via drag-and-drop.
- **Multi-Tagging**: Add multiple tags to a design for cross-referencing.

### 4.2 Enhanced Discovery
- **Live Previews**: Hovering over a design card shows a mini-animated preview of the flip-flap transition.
- **Advanced Filtering**: Filter by grid size, color theme, or date created.
- **Favorites**: A "Star" system to pin most-used designs to the top.

### 4.3 Collaboration & Sharing
- **Public/Private Toggle**: Users can mark designs as "Public" to appear in a community gallery.
- **Shareable Links**: Generate a unique URL for a design that others can "Import" into their own library.
- **Export to Image/GIF**: Generate a static image or animated GIF of the design for social sharing.

### 4.4 Content Management
- **Bulk Actions**: Select multiple designs to delete, move, or tag.
- **Import/Export JSON**: Allow power users to backup their library or migrate between accounts.
- **Usage Analytics**: Track how many times a design has been "Flipped" to a live board.

### 4.5 Smart Features
- **Auto-Drafts**: If a user leaves the designer without saving, store the state in a "Recent Drafts" section.
- **Template Library**: A set of pre-made professional templates (e.g., "Menu", "Welcome", "Clock") provided by the platform.

## 5. Technical Requirements
- **Database**: Update `premium_designs` table to support `tags` (array) and `collection_id`.
- **Storage**: Store thumbnail snapshots of designs in Supabase Storage for fast previews.
- **State Management**: Update `designStore.js` to handle collections and bulk operations.

## 6. UI/UX Design Principles
- **Clean & Minimal**: Use a "Glassmorphism" aesthetic consistent with the rest of the app.
- **Responsive**: Mobile-first design for the library list; desktop-optimized for organization.
- **Feedback-Rich**: Use `react-hot-toast` for all actions and Framer Motion for smooth transitions.
