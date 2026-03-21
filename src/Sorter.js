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

class Sorter {
  constructor() {
    this.sorting = false;
    this.isWaiting = false;
    this.lastCheck = Date.now();
    this.changeHandler = new ChangeHandler(this);
  }

  sortAllBookmarks() {
    const self = this;
    FolderUtil.getChildrenFolders(AsbPrefs.getRootId(), (children) => {
      self.sortRootFolders(children);
    });
  }

  sortRootFolders(children) {
    const promiseAry = [];

    children.forEach((node) => {
      const folder = NodeUtil.createItemFromNode(node);

      const p = new Promise((resolve) => {
        const folders = [];

        if (!node.recursivelyExcluded) {
          folders.push(folder);

          folder.getFolders((subfolders) => {
            subfolders.forEach((f) => folders.push(f));
            resolve(folders);
          });
        } else {
          resolve(folders);
        }
      });

      promiseAry.push(p);
    });

    Promise.all(promiseAry).then((folders) => {
      const mergedFolders = [].concat(...folders);
      Annotations.removeMissingFolders(mergedFolders);
      this.sortFolders(mergedFolders);
    });
  }

  setCriteria(
    firstSortCriteria,
    firstReverse,
    secondSortCriteria,
    secondReverse,
    folderSortCriteria,
    folderReverse,
    differentFolderOrder,
    caseInsensitive
  ) {
    Sorter.prototype.firstReverse = firstReverse ? -1 : 1;
    Sorter.prototype.firstSortCriteria = firstSortCriteria;
    Sorter.prototype.secondReverse = secondReverse ? -1 : 1;
    Sorter.prototype.secondSortCriteria = secondSortCriteria;
    Sorter.prototype.folderReverse = folderReverse ? -1 : 1;
    Sorter.prototype.folderSortCriteria = folderSortCriteria;
    Sorter.prototype.differentFolderOrder = differentFolderOrder;
    Sorter.prototype.caseInsensitive = caseInsensitive;
    this.compare = Comparator.createCompare();
  }

  sortAndSave(folder, resolve) {
    if (folder.canBeSorted()) {
      folder.getChildren(Sorter.sortFolder, this.compare, resolve);
    } else if (typeof resolve === "function") {
      resolve();
    }
  }

  static sortFolder(folder, compare, resolve) {
    let delta = 0;
    let length;

    for (let i = 0; i < folder.children.length; i += 1) {
      folder.children[i].sort(compare);
      length = folder.children[i].length;
      for (let j = 0; j < length; j += 1) {
        folder.children[i][j].setIndex(j + delta);
      }
      delta += length + 1;
    }

    folder.save(resolve);
  }

  sortFolders(folders) {
    folders = folders instanceof Folder ? [folders] : folders;

    const self = this;
    const promiseAry = [];

    folders.forEach((folder) => {
      const p = new Promise((resolve) => {
        self.sortAndSave(folder, resolve);
      });
      promiseAry.push(p);
    });

    Promise.all(promiseAry).then(() => {
      AsbUtil.log("sort:end");
      self.sorting = false;
      self.lastCheck = Date.now();
      // Wait for browser events triggered by the sort to settle before
      // re-attaching change listeners, to avoid triggering another sort.
      setTimeout(() => {
        this.changeHandler.createChangeListeners();
      }, 3000);
    });
  }

  sortNow() {
    this.sortIfNotSorting();
  }

  sortIfAuto() {
    if (AsbPrefs.getPref("auto_sort")) {
      this.sortNow();
    }
  }

  sortIfNotSorting() {
    if (!this.sorting) {
      this.lastCheck = Date.now();
      if (!this.isWaiting) {
        this.sortIfNoChanges();
      }
    }
  }

  sortIfNoChanges() {
    if (!this.sorting) {
      const now = Date.now();
      const diff = now - this.lastCheck;
      const delay = parseInt(AsbPrefs.getPref("delay"), 10) * 1000;
      if (diff < delay) {
        this.isWaiting = true;
        const self = this;
        setTimeout(() => {
          AsbUtil.log("waiting one second for activity to stop");
          self.sortIfNoChanges();
        }, 1000);
      } else {
        this.sorting = true;
        this.isWaiting = false;
        this.changeHandler.removeChangeListeners();
        AsbUtil.log("sort:begin");
        this.sortAllBookmarks();
      }
    }
  }
}
