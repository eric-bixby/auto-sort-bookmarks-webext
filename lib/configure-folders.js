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
const tabs = require('sdk/tabs');
const { removeDoNotSortAnnotation, removeRecursiveAnnotation, setDoNotSortAnnotation, setRecursiveAnnotation } = require('annotations');
const { BookmarkManager, Folder, getChildrenFolders, getRootFolders } = require('bookmarks');
const bookmarkManager = new BookmarkManager({});

/**
 * Show the page to configure the folders to exclude.
 */
function showConfigureFoldersToExclude() {
    return function() {
        function sendChildren(worker) {
            return function(parentID) {
                getChildrenFolders(parentID)
                    .then(function(children) {
                        worker.port.emit('children', parentID, children);
                    });
            };
        }

        let worker;

        function onRemove(item) {
            if(worker && item instanceof Folder) {
                worker.port.emit('remove-folder', item.id);
            }
        }

        bookmarkManager.on('remove', onRemove);

        tabs.open({
            url: data.url('configureFolders.html'),
            onOpen: function(tab) {
                tab.on('ready', function() {
                    worker = tab.attach({
                        contentScriptFile: data.url('configureFolders.js')
                    });

                    worker.port.on('sort-checkbox-change', function(folderID, activated) {
                        if(activated) {
                            removeDoNotSortAnnotation(folderID);
                        }
                        else {
                            setDoNotSortAnnotation(folderID);
                        }
                    });

                    worker.port.on('recursive-checkbox-change', function(folderID, activated) {
                        if(activated) {
                            setRecursiveAnnotation(folderID);
                        }
                        else {
                            removeRecursiveAnnotation(folderID);
                        }
                    });

                    worker.port.on('query-children', sendChildren(worker));

                    // TODO: make sure the folder is sorted when the annotations are removed.
                    worker.port.emit('init', getRootFolders(), data.url('add.png'), data.url('remove.png'));
                });
            },

            onClose: function() {
                worker = null;
                bookmarkManager.removeListener('remove', onRemove);
            },
        });
    };
}

exports.showConfigureFoldersToExclude = showConfigureFoldersToExclude;
