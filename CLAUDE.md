# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## No build step required

This is a plain vanilla WebExtension — no npm, no transpiler, no bundler. Load `src/` directly as a temporary extension in Firefox (`about:debugging` → "Load Temporary Add-on" → select `src/manifest.json`).

## Linting (optional)

```sh
npm install   # installs eslint/prettier if desired
npx eslint src/
```

No tests are defined in this project.

## Architecture

A Firefox WebExtension (Manifest V2) that auto-sorts bookmarks. All source lives in `src/`.

### Loading order matters

Background scripts are listed explicitly in `manifest.json` and share one global scope. They must be ordered so every identifier is defined before it is used at runtime:

```
AsbUtil → BrowserUtil → Annotations → Item → Bookmark → Folder → Separator
→ NodeUtil → FolderUtil → Comparator → ChangeHandler → AsbPrefs → Sorter → background.js
```

Classes reference each other in method/constructor bodies (not at class-definition time), so forward references in method bodies are fine.

### Data flow

1. `background.js` calls `AsbPrefs.load()` → loads prefs + annotations from `browser.storage.local`
2. Creates `new Sorter()` → which creates `ChangeHandler` and registers bookmark/history event listeners
3. On a change event, `ChangeHandler` calls `sorter.sortIfAuto()`
4. `Sorter` waits for inactivity (configurable delay), then removes listeners and calls `sortAllBookmarks()`
5. `FolderUtil.getChildrenFolders` walks the tree; `Folder.getChildren` + `Folder.getFolders` fetch children recursively
6. `Sorter.sortFolder` sorts each folder's children using the `Comparator.createCompare()` function
7. `Folder.save()` calls `browser.bookmarks.move()` for each item whose index changed
8. After 3 s (for browser events to settle), change listeners are re-added

### Key modules (`src/`)

| File | Role |
|------|------|
| `AsbPrefs.js` | Singleton: prefs storage, all `browser.runtime.onMessage` handling, messaging to UI pages |
| `Annotations.js` | Singleton: per-folder "do not sort" / "recursive" exclusion flags stored in `browser.storage.local` |
| `Sorter.js` | Orchestrates sorting: delay loop, folder recursion, listener management |
| `Comparator.js` | Builds the compare function from `Sorter.prototype.*` sort-criteria properties |
| `ChangeHandler.js` | Listens to `bookmarks.on*` and `history.onVisited`; routes events to Sorter |
| `FolderUtil.js` | `getChildrenFolders(parentId, cb)` — returns plain folder objects for a given parent |
| `Folder.js` | `getChildren()` and `getFolders()` live here (enriches nodes with history data) |
| `BrowserUtil.js` | Thin wrappers around `browser.*` APIs; all bookmark/history/storage methods return Promises |

### Model hierarchy (`src/`)
`Item` → `Bookmark` → `Folder` / `Separator`

### Sort-criteria state

`Sorter.setCriteria(...)` stores criteria as properties on `Sorter.prototype` (e.g. `Sorter.prototype.firstSortCriteria`). `Comparator.createCompare()` reads those same prototype properties to build a fresh comparator closure. `AsbPrefs.adjustSortCriteria()` wires these together whenever preferences change.

### UI pages (`src/`)

Three standalone HTML+JS pages — no framework:

| Page | Communicates via |
|------|-----------------|
| `popup.html` + `popup.js` | `browser.runtime.sendMessage` → background |
| `settings.html` + `settings.js` | `browser.runtime.sendMessage` → background |
| `configure-folders.html` + `configure-folders.js` | `browser.runtime.sendMessage` → background; also receives `removeFolder` push from background via `browser.runtime.onMessage` |

### Messaging contract (`browser.runtime.sendMessage`)

| `action` | Direction | Description |
|----------|-----------|-------------|
| `openSettings` | UI→bg | Opens settings tab |
| `openConfigureFolders` | UI→bg | Opens configure-folders tab |
| `sort` | UI→bg | Triggers an immediate sort |
| `getPrefs` | UI→bg | Returns all current pref values |
| `setPrefs` | UI→bg | Saves `{prefs: {...}}` to storage |
| `resetPrefs` | UI→bg | Resets to defaults, returns new values |
| `queryRoot` | UI→bg | Returns root folder children + icon URLs + i18n texts |
| `queryChildren` | UI→bg | Returns children of `{parentId}` |
| `sortCheckboxChange` | UI→bg | Updates do-not-sort annotation for `{folderId, activated}` |
| `recursiveCheckboxChange` | UI→bg | Updates recursive annotation for `{folderId, activated}` |
| `removeFolder` | bg→UI | Pushed to configure-folders tab when a folder is deleted |

### Storage layout (`browser.storage.local`)

| Key | Value |
|-----|-------|
| `prefs` | Object with all preference values |
| `donotsort` | `{folderId: true, ...}` — folders excluded from sorting |
| `recursive` | `{folderId: true, ...}` — folders recursively excluded |

### i18n

Locale strings live in `locales/<lang>/messages.json` (7 languages). Key patterns used:
- `weh_prefs_label_{name}` — preference row label
- `weh_prefs_description_{name}` — preference description
- `weh_prefs_{pref}_option_{value}` — select option label
