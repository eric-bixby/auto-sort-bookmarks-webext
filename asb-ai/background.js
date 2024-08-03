/*
 * Copyright (C) 2014-2015  Boucher, Antoni <bouanto@zoho.com>
 * Copyright (C) 2016-2024  Eric Bixby <ebixby@yahoo.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Represents the detected browser API.
 */
const browserAPI = detectBrowserAPI();

/**
 * Flag to indicate if sorting is in progress.
 */
let sorting = false;

/**
 * Sets the badge text for the browser action.
 * @param {string} text - The text to be displayed on the badge.
 */
function setBadgeText(text) {
  browserAPI.browserAction.setBadgeText({ text: text });
}

/**
 * Listens for changes and triggers the sorting of bookmarks.
 */
function changeListener() {
  if (sorting) {
    return; // Do not proceed if sorting is already in progress
  }

  sorting = true; // Set sorting flag to true
  setBadgeText("Srt"); // Set badge text to "Srt" while sorting

  // Disable listeners while sorting
  removeListeners();

  // Call sortBookmarks to perform sorting
  sortBookmarks().then(() => {
    // Sorting is finished, set sorting flag to false
    sorting = false;
    setBadgeText("End"); // Set badge text to "End" when sorting is done

    // Enable listeners after sorting
    addListeners();

    // Remove badge text after 5 seconds
    setTimeout(() => {
      setBadgeText("");
    }, 5000);
  });
}

/**
 * Adds event listeners for bookmark changes and icon click.
 */
function addListeners() {
  browserAPI.bookmarks.onCreated.addListener(changeListener);
  browserAPI.bookmarks.onRemoved.addListener(changeListener);
  browserAPI.bookmarks.onChanged.addListener(changeListener);
  browserAPI.bookmarks.onMoved.addListener(changeListener);

  // Add a click event listener to the extension's icon when adding listeners
  browserAPI.browserAction.onClicked.addListener(iconClickListener);
}

/**
 * Removes the event listeners for bookmark changes and the click event listener from the extension's icon.
 */
function removeListeners() {
  browserAPI.bookmarks.onCreated.removeListener(changeListener);
  browserAPI.bookmarks.onRemoved.removeListener(changeListener);
  browserAPI.bookmarks.onChanged.removeListener(changeListener);
  browserAPI.bookmarks.onMoved.removeListener(changeListener);

  // Remove the click event listener from the extension's icon when removing listeners
  browserAPI.browserAction.onClicked.removeListener(iconClickListener);
}

/**
 * Handles the click event on the icon.
 * @param {_tab} _tab - The tab object.
 * @returns {void}
 */
function iconClickListener(_tab) {
  // Trigger sorting when the icon is clicked
  changeListener();
}

/**
 * Detects the browser API available in the current browser environment.
 * @returns {object|null} The browser API object if supported, otherwise null.
 */
function detectBrowserAPI() {
  if (typeof browser !== "undefined" && browser.bookmarks) {
    return browser;
  } else if (typeof chrome !== "undefined" && chrome.bookmarks) {
    return chrome;
  } else if (typeof safari !== "undefined" && safari.extension) {
    return safari.extension;
  } else {
    console.error("WebExtensions API not supported in this browser");
    return null;
  }
}

/**
 * Sorts the bookmarks tree.
 */
function sortBookmarks() {
  return getBookmarksTree().then((bookmarks) => {
    const sortedTree = sortTree(bookmarks[0]);
    return Promise.resolve(); // No need to return a Promise
  });
}

/**
 * Retrieves the bookmarks tree.
 * @returns {Promise<Array<BookmarkTreeNode>>} A promise that resolves to an array of BookmarkTreeNode objects representing the bookmarks tree.
 */
function getBookmarksTree() {
  return browserAPI.bookmarks.getTree();
}

/**
 * Sorts the tree structure of bookmarks recursively.
 *
 * @param {Object} node - The root node of the tree structure.
 */
function sortTree(node) {
  if (node.children) {
    // Skip sorting the root node
    if (!node.parentId) {
      node.children = node.children.map((child) => {
        return sortTree(child);
      });
    } else {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        // Set index to the current position if it is not set
        if (!child.index) {
          child.index = i;
        }
      }

      // Sort child nodes in place
      node.children.sort((a, b) => {
        // sort folders before bookmarks
        if (a.url && !b.url) return 1; // 'a' is a bookmark, 'b' is a folder
        if (!a.url && b.url) return -1; // 'a' is a folder, 'b' is a bookmark

        // sort by title
        return a.title.localeCompare(b.title);
      });

      // Update child nodes by moving bookmarks in place
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.index !== i) {
          console.log(`Moving ${child.title} to index ${i}`);
          try {
            browserAPI.bookmarks.move(child.id, {
              index: i,
            });
          } catch (error) {
            console.error(`Failed to move bookmark: ${error} ${child.title}`);
          }
        }
        if (child.children) {
          sortTree(child);
        }
      }
    }
  }
}

// Add initial listeners
addListeners();
