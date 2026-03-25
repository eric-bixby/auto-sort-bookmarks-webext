# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## No build step required

This is a plain vanilla WebExtension — no transpiler, no bundler. Load `src/` directly as a temporary extension in Firefox (`about:debugging` → "Load Temporary Add-on" → select `src/manifest.json`).

## Testing

```sh
npm install       # installs jest and web-ext
npm test          # run Jest unit tests
npm run lint      # run web-ext lint
```

Tests live in `tests/unit/`. Jest config is in `jest.config.js`. A `browser` global mock is set up in `tests/setup/globals.js` (mocks `browser.bookmarks`, `browser.history`, `browser.storage.local`, `browser.runtime`, `browser.tabs`, `browser.windows`, and `browser.i18n`). Each source file exports itself via a conditional `module.exports` shim at the bottom (no-op in the browser, required by Jest).

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on pushes and PRs to `master`. It installs dependencies, runs `npm test`, and runs `npm run lint` on Node.js 24.

## Architecture

A Firefox WebExtension (Manifest V2) that auto-sorts bookmarks. All source lives in `src/`.

### Loading order matters

Background scripts are listed explicitly in `manifest.json` and share one global scope. They must be ordered so every identifier is defined before it is used at runtime:

```
AsbUtil → Annotations → NodeUtil → FolderUtil → Comparator → ChangeHandler → AsbPrefs → Sorter → background.js
```

Globals referenced inside function/method bodies (not at definition time) may appear later in the list.

### Data flow

1. `background.js` calls `AsbPrefs.load()` → loads prefs + annotations from `browser.storage.local`
2. `createSorter()` creates the sorter, which internally creates a `ChangeHandler` and registers bookmark/history event listeners
3. On a change event, `ChangeHandler` calls `sorter.sortIfAuto()`
4. `Sorter` debounces using the configured delay, then removes listeners and calls `sortAllBookmarks()`
5. `FolderUtil.getDescendantFolders` walks the tree depth-first, skipping recursively excluded folders
6. Each folder's children are fetched, enriched with history data, split by separators, and sorted via `createCompare()`
7. `FolderUtil.saveOrder()` calls `browser.bookmarks.move()` for each item whose index changed
8. After 3 s (for browser events to settle), change listeners are re-attached

### Key modules (`src/`)

| File | Role |
|------|------|
| `AsbUtil.js` | Namespace object: `log()` and `reverseBaseUrl()` |
| `Annotations.js` | Singleton IIFE: per-folder "do not sort" / "recursive" exclusion flags in `browser.storage.local` |
| `NodeUtil.js` | IIFE: `getNodeType()` and `createItemFromNode()` — creates typed plain objects from browser nodes |
| `FolderUtil.js` | IIFE: `getDescendantFolders`, `getChildrenFolders`, `canBeSorted`, `getChildrenWithHistory`, `saveOrder` |
| `Comparator.js` | `createCompare(criteria)` — builds a comparator function from a `SortCriteria` object |
| `ChangeHandler.js` | `createChangeHandler(sorter)` — attaches/detaches bookmark and history event listeners |
| `AsbPrefs.js` | Singleton IIFE: preference storage, all `browser.runtime.onMessage` handling, messaging to UI |
| `Sorter.js` | `createSorter()` — debounce logic, tree traversal, listener lifecycle |
| `background.js` | Entry point: loads prefs, creates sorter, wires listeners |
| `styles.css` | Shared stylesheet for popup and settings pages |
| `images/` | Extension icons (`icon.svg`, `add.png`, `remove.png`) |

### Item types (`src/NodeUtil.js`)

All items are plain objects. `createItemFromNode(node)` returns one of:
- `BookmarkItem` — has `type`, `id`, `index`, `oldIndex`, `parentId`, `title`, `url`, `dateAdded`, `lastModified`, `lastVisited`, `accessCount`, `order`, `corrupted`
- `FolderItem` — has `type`, `id`, `index`, `oldIndex`, `parentId`, `title`, `dateAdded`, `lastModified`, `order`
- `SeparatorItem` — has `type`, `id`, `index`, `oldIndex`, `parentId` only

### Sort-criteria flow

`AsbPrefs.adjustSortCriteria()` calls `sorter.setCriteria({...})` with a `SortCriteria` object whenever a sort-related preference changes. `setCriteria` calls `createCompare(criteria)` to build a fresh comparator closure.

### UI pages (`src/`)

Two standalone HTML+JS pages — no framework:

| Page | Communicates via |
|------|-----------------|
| `popup.html` + `popup.js` | `browser.runtime.sendMessage` → background |
| `settings.html` + `settings.js` | `browser.runtime.sendMessage` → background; has two tabs: Settings and Configure Folders |

### Messaging contract (`browser.runtime.sendMessage`)

| `action` | Direction | Description |
|----------|-----------|-------------|
| `openSettings` | UI→bg | Focuses existing settings tab or opens a new one |
| `sort` | UI→bg | Triggers an immediate sort |
| `getPrefs` | UI→bg | Returns all current pref values |
| `setPrefs` | UI→bg | Saves `{prefs: {...}}` to storage |
| `resetPrefs` | UI→bg | Resets to defaults, returns new values |
| `queryRoot` | UI→bg | Returns root folder children + icon URLs + i18n texts |
| `queryChildren` | UI→bg | Returns children of `{parentId}` |
| `sortCheckboxChange` | UI→bg | Updates do-not-sort annotation for `{folderId, activated}` |
| `recursiveCheckboxChange` | UI→bg | Updates recursive annotation for `{folderId, activated}` |
| `removeFolder` | bg→UI | Pushed to settings tab when a folder is deleted |

### Storage layout (`browser.storage.local`)

| Key | Value |
|-----|-------|
| `prefs` | Object with all preference values |
| `donotsort` | `{folderId: true, ...}` — folders excluded from sorting |
| `recursive` | `{folderId: true, ...}` — folders recursively excluded |

### Preferences

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `auto_sort` | boolean | `false` | Sort automatically on bookmark changes |
| `delay` | number | `3` | Inactivity delay in seconds before sorting |
| `case_insensitive` | boolean | `false` | Ignore case when comparing titles/URLs |
| `sort_by` | string | `"title"` | Primary sort field for bookmarks |
| `inverse` | boolean | `false` | Reverse primary sort direction |
| `then_sort_by` | string | `"none"` | Secondary sort field (`"none"` to disable) |
| `then_inverse` | boolean | `false` | Reverse secondary sort direction |
| `folder_sort_by` | string | `"title"` | Sort field for folders (`"none"` to preserve order) |
| `folder_inverse` | boolean | `false` | Reverse folder sort direction |
| `sort_folders_first` | boolean | `true` | Sort folders before bookmarks when true |

### i18n

Locale strings live in `src/_locales/<lang>/messages.json` (7 languages). Key patterns:
- `prefs_label_{name}` — preference row label
- `prefs_description_{name}` — preference description
- `prefs_{pref}_option_{value}` — select option label
