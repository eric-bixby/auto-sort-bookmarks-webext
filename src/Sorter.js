/*
 * Copyright (C) 2014-2015  Boucher, Antoni <bouanto@zoho.com>
 * Copyright (C) 2016-2026  Eric Bixby <ebixby@yahoo.com>
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

// Creates the sorter, which orchestrates bookmark sorting across all folders.
// Returns { sortIfAuto, sortNow, setCriteria }.
function createSorter() {
  let sorting = false;
  let debounceTimer = null;
  let compare = null;

  async function sortAllBookmarks() {
    const rootChildren = await browser.bookmarks.getChildren(AsbPrefs.getRootId());
    if (!rootChildren) {
      return;
    }

    // Collect all sortable folders across the entire tree.
    const folderGroups = await Promise.all(
      rootChildren
        .filter(
          (node) =>
            NodeUtil.getNodeType(node) === "folder" &&
            !Annotations.isRecursivelyExcluded(node.id)
        )
        .map((node) => FolderUtil.getDescendantFolders(node.id))
    );

    const allFolders = folderGroups.flat();
    Annotations.removeMissingFolders(allFolders);
    await Promise.all(allFolders.map((folder) => sortAndSave(folder)));
  }

  async function sortAndSave(folder) {
    if (!FolderUtil.canBeSorted(folder)) {
      return;
    }

    const groups = await FolderUtil.getChildrenWithHistory(folder.id);

    // Sort each group and assign new indices, accounting for separator gaps.
    let delta = 0;
    for (const group of groups) {
      group.sort(compare);
      group.forEach((item, j) => {
        item.index = j + delta;
      });
      delta += group.length + 1; // +1 for the separator after each group
    }

    await FolderUtil.saveOrder(groups);
  }

  // Debounced sort: resets the timer on each call, runs after the configured
  // delay has elapsed with no further activity.
  function scheduleSort() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (sorting) {
        return;
      }
      sorting = true;
      changeHandler.removeChangeListeners();
      AsbUtil.log("sort:begin");
      await sortAllBookmarks();
      AsbUtil.log("sort:end");
      sorting = false;
      // Wait for browser events triggered by the sort to settle before
      // re-attaching listeners, to avoid immediately triggering another sort.
      setTimeout(() => changeHandler.createChangeListeners(), 3000);
    }, AsbPrefs.getPref("delay") * 1000);
  }

  const sorter = {
    sortIfAuto() {
      if (AsbPrefs.getPref("auto_sort")) {
        scheduleSort();
      }
    },

    sortNow() {
      scheduleSort();
    },

    setCriteria(criteria) {
      compare = createCompare(criteria);
    },
  };

  const changeHandler = createChangeHandler(sorter);
  return sorter;
}
