
[Auto-Sort Bookmarks](https://addons.mozilla.org/en-US/firefox/addon/auto-sort-bookmarks/)
==================

[<img src="https://img.shields.io/amo/stars/auto-sort-bookmarks.svg">](https://addons.mozilla.org/firefox/addon/auto-sort-bookmarks/reviews/)
[<img src="https://img.shields.io/amo/users/auto-sort-bookmarks.svg">](https://addons.mozilla.org/firefox/addon/auto-sort-bookmarks/statistics)
[<img src="https://img.shields.io/github/release/eric-bixby/auto-sort-bookmarks-webext.svg">](https://github.com/eric-bixby/auto-sort-bookmarks-webext/releases)
[<img src="https://img.shields.io/github/license/eric-bixby/auto-sort-bookmarks-webext.svg">](https://github.com/eric-bixby/auto-sort-bookmarks-webext/blob/master/LICENSE)
[<img src="https://github.com/eric-bixby/auto-sort-bookmarks-webext/actions/workflows/ci.yml/badge.svg">](https://github.com/eric-bixby/auto-sort-bookmarks-webext/actions/workflows/ci.yml)

Firefox add-on that sorts bookmarks by multiple criteria. Requires **Firefox 142 or later**.

---

**Settings:**

- **Auto-sort:** If this option is enabled, the bookmarks will be sorted when bookmarks are added, changed, moved or deleted.
- **Inactivity Wait:** Specifies how long to wait (in seconds) for inactivity before sorting bookmarks. This applies to automatic and manual sorting. A minimum value of 3 and a maximum of 255. Recommend using a value of at least 45 if you move bookmarks by dragging.
- **Case Insensitive:** If this option is enabled, the bookmarks will be sorted without considering the letter case.
- **Sort By:** Specifies the first sort criteria to sort the bookmarks.
- **Inverse Order:** if this option is enabled, the order specified in 'Sort By' will be reversed. So the order will be descending.
- **Then Sort By:** Specifies the second sort criteria to sort the bookmarks.
- **Inverse Second Order:** If this option is enabled, the order specified in 'Then Sort By' will be reversed.
- **Sort Folder By:** Specifies sort criteria to sort folders.
- **Inverse Folder Order:** If this option is enabled, the order specified in 'Sort Folder By' will be reversed.
- **Sort Folders First:** If this option is enabled, folders are sorted before bookmarks. If unchecked, bookmarks are sorted before folders.
- **Configure Folders:** The "Configure Folders" tab in Settings allows you to exclude folders from sorting. If you uncheck the checkbox next to a folder, it won't be sorted, but the children folders will be sorted. If you want to exclude a folder recursively from being sorted, check the recursive checkbox.

**Backup your current bookmarks** in case you do not like the new bookmarks order. To restore bookmarks, use Firefox's Bookmark Manager (click on Bookmarks menu, select Show All Bookmarks, then click on "Z" icon, select Restore, and select restore point based on date/time).

**Reviewers:** Your constructive feedback is appreciated. However, if you need technical support, discover a bug, or have a feature request, then [write an issue](https://github.com/eric-bixby/auto-sort-bookmarks-webext/issues) on the support site.

---

**[Version History/Releases](https://github.com/eric-bixby/auto-sort-bookmarks-webext/releases)**

---

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- Firefox 142 or later

### Setup

```sh
npm ci
```

### Load in Firefox

1. Open `about:debugging` in Firefox
2. Click **This Firefox** → **Load Temporary Add-on**
3. Select `src/manifest.json`

### Testing

```sh
npm test
```

### Linting

```sh
npm run lint
```
