[Auto-Sort Bookmarks](https://addons.mozilla.org/en-US/firefox/addon/auto-sort-bookmarks/)
==========================================================================================

Provides a way to sort bookmarks automatically or manually.

This extension considers separators by sorting bookmarks between separators. However, set the delay before sorting (Inactivity Wait) to 45 seconds as the auto-sorting may happen while dragging bookmarks. Unforetunately, this add-on cannot detect when bookmarks are being dragged.

**Backup your current bookmarks** in case you do not like the new bookmarks order. To restore bookmarks, use Firefox's Boomark Manager (click on Boomarks menu, select Show All Bookmarks, then click on "Z" icon, select Restore, and select restore point based on date/time).

**Reviewers:** Your constructive feedback is appreciated. However, if you need technical support, discover a bug, or have a feature request, then [write an issue](https://github.com/eric-bixby/auto-sort-bookmarks-webext/issues) on the support site.

**Settings:**
* **Auto-sort:** If this option is enabled, the bookmarks will be sorted when bookmarks are added, changed, moved or deleted.
* **Inactivity Wait:** Specifies how long to wait (in seconds) for inactivity before sorting bookmarks. This applies to automatic and manual sorting. Minimum value of 3 and maximum of 255. Recomend using a value of at least 45 if you move bookmarks by dragging.
* **Case Insensitive:** If this option is enabled, the bookmarks will be sorted without considering the letter case.
* **Sort By:** Specifies the first sort criteria to sort the bookmarks.
* **Inverse Order:** if this option is enabled, the order specified in 'Sort By' will be reversed. So the order will be descending.
* **Then Sort By:** Specifies the second sort criteria to sort the bookmarks.
* **Inverse Second Order:** If this option is enabled, the order specified in 'Then Sort By' will be reversed.
* **Sort Folder By:** Specifies a sort criteria to sort folders.
* **Inverse Folder Order:** If this option is enabled, the order speficied in 'Sort Folder By' will be reversed.
* **Folder Sort Order:** Specifies the folder sort order. Minimum value of 1 and maximum of 2.
* **Bookmark Sort Order:** Specifies the bookmark sort order. Minimum value of 1 and maximum of 2.
* **Configure Folders:** This button opens a new tab allowing you to exclude folders when sorting. If you uncheck the checkbox next to a folder, it won't be sorted, but the children folders will be sorted. If you want to exclude a folder recursively from being sorted, check the recursive checkbox.

