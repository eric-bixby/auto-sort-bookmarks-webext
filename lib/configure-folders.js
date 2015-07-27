/*
 * Copyright (C) 2015  Boucher, Antoni <bouanto@zoho.com>
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

'use strict';

const self = require('sdk/self');
const data = self.data;
const simplePrefs = require('sdk/simple-prefs');
const prefs = simplePrefs.prefs;
const tabs = require('sdk/tabs');
const { getChildrenFolders, getRootFolders } = require('bookmarks');
const { BookmarkManager, Folder } = require('bookmarks');
const bookmarkManager = new BookmarkManager({});

/**
 * Remove a folder from the exclude preference.
 */
function removeFolderToExclude(folderID) {
    let foldersToExclude = JSON.parse(prefs.folders_to_exclude);
    let i;

    for(let index in foldersToExclude) {
        if(foldersToExclude[index].id === folderID) {
            i = index;
        }
    }

    if(i) {
        foldersToExclude.splice(i, 1);
    }

    prefs.folders_to_exclude = JSON.stringify(foldersToExclude);
}

/**
 * Remove a folder from the exclude preference if it is removed.
 */
function onRemove(item) {
    if(item instanceof Folder) {
        removeFolderToExclude(item.id);
    }
}

bookmarkManager.on('remove', onRemove);

/**
 * Show the page to configure the folders to exclude.
 */
function showConfigureFoldersToExclude(sortIfAuto) {
    return function() {
        function addFolderToExclude(folderID, recursive) {
            removeFolderToExclude(folderID);
            let foldersToExclude = JSON.parse(prefs.folders_to_exclude);
            let folder = {
                id: folderID
            };

            if(recursive) {
                folder.recursive = true;
            }

            foldersToExclude.push(folder);
            prefs.folders_to_exclude = JSON.stringify(foldersToExclude);
        }

        function updateFoldersToExclude(folderID, activated, recursive) {
            if(activated) {
                removeFolderToExclude(folderID);
            }
            else {
                addFolderToExclude(folderID, recursive);
            }

            sortIfAuto();
        }

        function sendChildren(worker) {
            return function(parentID) {
                getChildrenFolders(parentID)
                    .then(function(children) {
                        worker.port.emit('children', parentID, children);
                    });
            };
        }

        function createListener(worker) {
            return function() {
                worker.port.emit('update-excluded-folders', JSON.parse(prefs.folders_to_exclude));
            };
        }

        let listener;

        tabs.open({
            url: data.url('configureFolders.html'),
            onOpen: function(tab) {
                tab.on('ready', function() {
                    let worker = tab.attach({
                        contentScriptFile: data.url('configureFolders.js')
                    });
                    worker.port.on('checkbox-change', updateFoldersToExclude);
                    worker.port.on('query-children', sendChildren(worker));

                    listener = createListener(worker);
                    simplePrefs.on('folders_to_exclude', listener);

                    if(!prefs.folders_to_exclude) {
                        prefs.folders_to_exclude = JSON.stringify([]);
                    }

                    worker.port.emit('init', getRootFolders(), JSON.parse(prefs.folders_to_exclude), data.url('add.png'), data.url('remove.png'));
                });
            },

            onClose: function() {
                simplePrefs.removeListener('folders_to_exclude', listener);
            },
        });
    };
}

exports.showConfigureFoldersToExclude = showConfigureFoldersToExclude;
