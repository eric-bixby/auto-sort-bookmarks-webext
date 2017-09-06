[Auto-Sort Bookmarks](https://addons.mozilla.org/en-US/firefox/addon/auto-sort-bookmarks/)
==========================================================================================
[![Build
Status](https://travis-ci.org/eric-bixby/auto-sort-bookmarks-webext.svg?branch=master)](https://travis-ci.org/eric-bixby/auto-sort-bookmarks-webext)

Firefox Plugin to Sort Bookmarks by Multiple Criteria

Description
-----------

Provide a way to sort all bookmarks and automatically sort bookmarks.

This extension considers separators, so that it sorts bookmarks between separators.
This extension adds an icon to sort all bookmarks to the toolbar. To remove it, you must choose the Customize option  in the context menu on the Firefox user interface.

**Please backup your current bookmarks in case you do not like the new bookmarks order. Thus, you could restore them.**

This extension provides a few options categorized within these categories:
* Main Options
* Exclude Folders
* Sort Criteria
* Sort Order

These options work like this:

**Main Options:**

* **Auto-sort:** if this option is enabled, the bookmarks will be sorted when Firefox is opened, when this option is activated and when bookmarks are added, changed, moved or deleted.
This means you cannot move any bookmarks in the same folder, unless it is moved over a separator.
* **Delay:** allow to define a delay (in seconds) before automatically sorting bookmarks.
* **Delay for Folders:** allow to define a delay (in seconds) before automatically sorting folders. This is to avoid that a new folder is sorted before you can choose it when adding a new bookmark.
* **Case Insensitive:** if activated, the bookmarks will be sorted without considering the letter case.

**Exclude Folders:**

This button opens a new tab allowing you to exclude folders when sorting. If you uncheck the checkbox next to a folder, it wont be sorted, but the children folders will be sorted.
If you want to exclude a folder recursively from being sorted, check the recursive checkbox.

**Sort Criteria:**

* **Sort By:** allow to specify the first sort criteria, that is to say, the order that will be used to sort the bookmarks. The choices are : name, url, description, keyword, date added, last modified, last visited, visited count and reversed base-URL.
* **Inverse Order:** if this option is enabled, the order specified in "Sort By" will be reversed. So the order will be descending.
* **Then Sort By:** allow to specify a second sort criteria (optional). For instance, if the first sort criteria is the name, it is possible to choose a second sort criteria to sort bookmarks with the same name.
* **Inverse Second Order:** if this option is enabled, the order specified in "Then Sort By" will be reversed.
* **Sort Folder By:** allow to specify a different sort criteria for folders. For instance, you might want to sort folders by name and other kinds of bookmarks by last visited.
* **Inverse Folder Order:** if this option is enabled, the order speficied in "Sort Folder By" will be reversed.

**Sort Order:**

* **Folder Sort Order:** this option specify the order in which the folders are sorted. For instance, it is possible to sort folders before livemarks, smart bookmarks and bookmarks. To do this, the folder sort order should be lesser than the other sort orders.
If the sort order of two types are at the same level, the bookmarks from these types will be sorted together.
* **Livemark Sort Order:** this option specify the sort order of livemarks.
* **Smart Bookmark Sort Order:** this option specify the sort order of smart bookmarks
* **Bookmark Sort Order:** this option specify the bookmark sort order.
