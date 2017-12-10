/*
 * Copyright (C) 2014-2017  Boucher, Antoni <bouanto@zoho.com>
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
 * Get the children folders of a folder.
 *
 * @param {string} parentId The parent ID.
 * @return {Array}
 */
function getChildrenFolders(parentId, callback) {
    browser.bookmarks.getChildren(parentId, function (o) {
        if (o !== undefined) {
            let children = [];
            for (let node of o) {
                children.push({
                    id: node.id,
                    title: node.title,
                    excluded: hasDoNotSortAnnotation(node.id),
                    recursivelyExcluded: hasRecursiveAnnotation(node.id),
                });
            }

            if (typeof callback === "function") {
                callback(children);
            }
        }
    });
}

/**
 * Get the root folders.
 * 
 * @return {Array}
 */
function getRootFolders() {
    let folders = [];
    for (let id of asb.rootFolderIds) {
        folders.push({
            id: id,
            excluded: hasDoNotSortAnnotation(id),
            recursivelyExcluded: hasRecursiveAnnotation(id)
        });
    }

    return folders;
}

/**
 * Show the page to configure the folders to exclude.
 */
function showConfigureFoldersToExclude() {
    return function () {
        /**
         * Send children.
         * @param worker
         * @returns {Function}
         */
        function sendChildren(worker) {
            return function (parentId) {
                getChildrenFolders(parentId, function (children) {
                    worker.port.emit("children", parentId, children);
                });
            };
        }

        let worker;

        /**
         * Handle onRemove event.
         * @param item
         */
        function onRemove(item) {
            if (worker && item instanceof Folder) {
                worker.port.emit("remove-folder", item.id);
            }
        }

        // bookmarkManager.on("remove", onRemove);

        browser.tabs.open({
            url: data.url("configureFolders.html"),
            onOpen: function (tab) {
                tab.on("ready", function () {
                    worker = tab.attach({
                        contentScriptFile: data.url("configureFolders.js")
                    });

                    worker.port.on("sort-checkbox-change", function (folderID, activated) {
                        if (activated) {
                            removeDoNotSortAnnotation(folderID);
                        }
                        else {
                            setDoNotSortAnnotation(folderID);
                        }
                    });

                    worker.port.on("recursive-checkbox-change", function (folderID, activated) {
                        if (activated) {
                            setRecursiveAnnotation(folderID);
                        }
                        else {
                            removeRecursiveAnnotation(folderID);
                        }
                    });

                    worker.port.on("query-children", sendChildren(worker));

                    const texts = {
                        recursiveText: "Recursive",
                        messageText: "The sub-folders are recursively excluded.",
                        loadingText: "Loading...",
                    };

                    // TODO: fix url for images
                    worker.port.emit("init", getRootFolders(), this.data.url("add.png"), this.data.url("remove.png"), texts);
                });
            },

            onClose: function () {
                worker = null;
                //bookmarkManager.removeListener("remove", onRemove);
            },
        });
    };
}
