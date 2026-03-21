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

/**
 * @typedef {Object} Sorter
 * @property {function(): void}                sortIfAuto   - Schedules a sort only when auto-sort is enabled.
 * @property {function(): void}                sortNow      - Schedules a sort unconditionally.
 * @property {function(SortCriteria): void}    setCriteria  - Rebuilds the comparator from new criteria.
 */

/**
 * Creates the sorter, which orchestrates bookmark sorting across all folders.
 *
 * **Sort lifecycle**
 * 1. A bookmark or history event fires → {@link ChangeHandler} calls `sortIfAuto`.
 * 2. `sortIfAuto` calls `scheduleSort`, which debounces using the configured delay.
 * 3. After the delay elapses with no further activity, change listeners are removed
 *    and `sortAllBookmarks` runs.
 * 4. Each sortable folder's children are fetched, enriched with history data,
 *    sorted, and saved back via `browser.bookmarks.move`.
 * 5. Three seconds after sorting completes (allowing browser events to settle),
 *    change listeners are re-attached.
 *
 * @returns {Sorter}
 */
function createSorter() {
  /** @type {boolean} True while a sort is in progress; prevents re-entrant sorts. */
  let sorting = false;

  /** @type {number|null} Handle for the pending debounce timer. */
  let debounceTimer = null;

  /** @type {function|null} The active comparator, built from the current {@link SortCriteria}. */
  let compare = null;

  /**
   * Collects all sortable folders in the bookmark tree and sorts each one.
   * Cleans up stale annotations for any folders that no longer exist.
   * @returns {Promise<void>}
   */
  async function sortAllBookmarks() {
    const rootChildren = await browser.bookmarks.getChildren(AsbPrefs.getRootId());
    if (!rootChildren) {
      return;
    }

    // Collect every sortable folder across the entire tree in parallel.
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

  /**
   * Sorts the children of a single folder and saves any changed positions.
   *
   * Children are split into groups by separators. Within each group items are
   * sorted using the current comparator, then assigned contiguous indices
   * starting after the previous group's separator. Only items whose index
   * actually changed are moved.
   *
   * @param {FolderItem} folder - The folder to sort.
   * @returns {Promise<void>}
   */
  async function sortAndSave(folder) {
    if (!FolderUtil.canBeSorted(folder)) {
      return;
    }

    const groups = await FolderUtil.getChildrenWithHistory(folder.id);

    // Sort each separator-delimited group and assign new indices.
    // delta tracks the running offset so that index assignments skip over
    // the separator between groups (+1 per separator).
    let delta = 0;
    for (const group of groups) {
      group.sort(compare);
      group.forEach((item, j) => {
        item.index = j + delta;
      });
      delta += group.length + 1; // +1 accounts for the separator after each group
    }

    await FolderUtil.saveOrder(groups);
  }

  /**
   * Schedules a sort after the configured inactivity delay.
   * Each call resets the timer, so rapid successive events coalesce into
   * a single sort run (debounce pattern).
   */
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
      // Delay re-attaching listeners so that the browser events produced by
      // the sort's own bookmark moves have time to settle.
      setTimeout(() => changeHandler.createChangeListeners(), 3000);
    }, AsbPrefs.getPref("delay") * 1000);
  }

  /** @type {Sorter} */
  const sorter = {
    /**
     * Schedules a sort if the auto-sort preference is enabled.
     * Called by {@link ChangeHandler} on every bookmark or history event.
     */
    sortIfAuto() {
      if (AsbPrefs.getPref("auto_sort")) {
        scheduleSort();
      }
    },

    /**
     * Schedules a sort unconditionally, regardless of the auto-sort setting.
     * Triggered by the "Sort Now" button in the popup.
     */
    sortNow() {
      scheduleSort();
    },

    /**
     * Rebuilds the internal comparator from updated sort criteria.
     * Called by {@link AsbPrefs.adjustSortCriteria} whenever a sort-related
     * preference changes.
     * @param {SortCriteria} criteria
     */
    setCriteria(criteria) {
      compare = createCompare(criteria);
    },
  };

  const changeHandler = createChangeHandler(sorter);
  return sorter;
}

// eslint-disable-next-line no-undef
if (typeof module !== "undefined") module.exports = { createSorter };
