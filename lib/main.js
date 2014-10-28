/* jshint bitwise: true, browser: true, curly: true, eqeqeq: true, forin: true, freeze: true, immed: true, indent: 4, latedef: true, moz: true, newcap: true, noarg: true, noempty: true, nonbsp: true, nonew: true, quotmark: single, undef: true, unused: true, strict: true */
/*global require: false, exports: false */

/*
 * Copyright (C) 2014  Boucher, Antoni <bouanto@gmail.com>
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

/**
 * TODO: change install.rdf from xpi file to support palemoon 25.
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 * FIXME: bug when moving a separator or moving across a separtor in auto sort mode (cannot reproduce — use the bookmark observer to log the actions you tried).
 * TODO: look for errors on rare case (sorting and deleting the same folder or trying to move a deleted item — make some error tests).
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * TODO: whenever an option is changed, call sortIfAuto().
 * TODO: translate the options in French.
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * TODO: Add option to include/exclude folders.
 * TODO: Add option to toggle case insensitive and case sensitive sort.
 * 
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * 
 * TODO: only delay the folder sort for new folder when the user is in the new bookmark dialog.
 */

const _ = require('sdk/l10n').get,
    { get, has, reset, set } = require('sdk/preferences/service'),
    self = require('sdk/self'),
    data = self.data,
    simplePrefs = require('sdk/simple-prefs'),
    prefs = simplePrefs.prefs,
    { merge } = require('sdk/util/object'),
    windowUtils = require('sdk/window/utils'),
    { XulKey } = require('key'),
    { ToolbarButton } = require('toolbarbutton'),
    { CustomizeObserver } = require('customize-observer'),
    { Menuitem } = require('menuitem'),
    { BookmarkManager, Folder, Separator } = require('bookmarks'),
    bookmarkManager = new BookmarkManager({}),
    { BookmarkSorter } = require('bookmark-sorter'),
    { getOptionName, migratePreference, migrateObjectPreference, setHiddenPreference, setPreferenceMaximum, setPreferenceMinimum } = require('options'),
    KEY_ID = 'addon:autosortbookmark:cmd-alt-shift-s',
    SECOND = 1000,
    TOOLBAR_MENU_ITEM = 'auto-sort-bookmarks-sort-all-bookmarks-toolbar-menu',
    sortCriterias = [
        'title',
        'url',
        'description',
        'keyword',
        'dateAdded',
        'lastModified',
        'lastVisited',
        'accessCount'
    ];

let customizeObserver = new CustomizeObserver(),
    bookmarkSorter = new BookmarkSorter();

/**
 * Add the bookmark observer.
 */
function addBookmarkObserver() {
    bookmarkManager.on('begin-batch', onBeginBatch);
    bookmarkManager.on('end-batch', onEndBatch);
    bookmarkManager.on('add', sortFolderOrItem);
    bookmarkManager.on('change', onChange);
    bookmarkManager.on('move', sortFolderOrItem);
    bookmarkManager.on('remove', onRemove);
    bookmarkManager.on('visit', sortItemAfterDelay);
}

/**
 * Add the menu item in the bookmarks button if needed.
 */
function addBookmarksButtonMenuItem(button) {
    let found = false;
    for(let child of button.childNodes[0].childNodes) {
        if(child.id === TOOLBAR_MENU_ITEM) {
            child.style.display = prefs.show_bookmarks_toolbar_menu_item ? '' : 'none';
            found = true;
        }
    }
    if(!found) {
        createBookmarksButtonMenuItem();
    }
}

/**
 * Adjust the auto sorting feature.
 */
function adjustAutoSort() {
    removeBookmarkObserver();
    if(prefs.auto_sort) {
        addBookmarkObserver();
        sortAllBookmarks();
    }
}

/**
 * Adjust the first run preference.
 */
function adjustFirstRun() {
    let prefName = getOptionName('firstrun');
    
    if(has(prefName)) {
        set(prefName, false);
    }
    else {
        set(prefName, true);
        prefs.auto_sort = false;
    }
}

/**
 * Adjust the menu items display.
 */
function adjustMenuDisplay() {
    for(let window of windowUtils.windows()) {
        if(windowUtils.isBrowser(window)) {
            let toolMenuItem = window.document.getElementById('auto-sort-bookmarks-sort-all-tools-menu');
            if(toolMenuItem !== null) {
                toolMenuItem.style.display = prefs.show_tools_menu_item ? '' : 'none';
            }
            
            let bookmarksMenuItem = window.document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-menu');
            if(bookmarksMenuItem !== null) {
                bookmarksMenuItem.style.display = prefs.show_bookmarks_menu_item ? '' : 'none';
            }
            
            let bookmarksAppMenuItem = window.document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-app-menu');
            if(bookmarksAppMenuItem !== null) {
                bookmarksAppMenuItem.style.display = prefs.show_bookmarks_menu_item ? '' : 'none';
            }
            
            let toolbarMenuItem = window.document.getElementById(TOOLBAR_MENU_ITEM);
            if(toolbarMenuItem !== null) {
                toolbarMenuItem.setAttribute('class', 'menuitem-iconic subviewbutton'); // FIX icon's position
                toolbarMenuItem.style.display = prefs.show_bookmarks_toolbar_menu_item ? '' : 'none';
            }
        }
        else if(window.location === 'chrome://browser/content/places/places.xul') {
            let bookmarksManagerMenuItem = window.document.getElementById('auto-sort-bookmarks-sort-all-bookmarks-organiser-menu');
            if(bookmarksManagerMenuItem !== null) {
                bookmarksManagerMenuItem.style.display = prefs.show_bookmarks_manager_menu_item ? '' : 'none';
            }
        }
    }
}

/**
 * Adjust the sort criteria of the bookmark sorter.
 */
function adjustSortCriteria() {
    bookmarkSorter.setCriteria(sortCriterias[prefs.sort_by], prefs.inverse, sortCriterias[prefs.then_sort_by], prefs.then_inverse);
    sortIfAuto();
}

/**
 * Create the menu item in the bookmarks button.
 */
function createBookmarksButtonMenuItem() {
    if(windowUtils.getMostRecentBrowserWindow().document.getElementById('BMB_bookmarksPopup') !== null) {
        Menuitem({
            accesskey: _('sort_bookmarks.s'),
            key: KEY_ID,
            id: TOOLBAR_MENU_ITEM,
            image: data.url('icon.png'),
            insertafter: 'BMB_bookmarksShowAllTop', // FIX menuitem's position
            label: _('sort_bookmarks'),
            location: 'chrome://browser/content/browser.xul',
            menuid: 'BMB_bookmarksPopup',
            onCommand: sortAllBookmarks,
            onInsert: adjustMenuDisplay
        });
    }
}

/**
 * Create the events.
 */
function createEvents() {
    simplePrefs.on('auto_sort', function() {
        adjustAutoSort();
    });
    
    let preferences = ['sort_menu', 'sort_toolbar', 'sort_unsorted', 'folder_sort_order', 'livemark_sort_order', 'smart_bookmark_sort_order', 'bookmark_sort_order'];
    
    for(let preference of preferences) {
        simplePrefs.on(preference, sortIfAuto);
    }
    
    simplePrefs.on('sort_by', adjustSortCriteria);
    simplePrefs.on('then_sort_by', adjustSortCriteria);
    simplePrefs.on('inverse', adjustSortCriteria);
    simplePrefs.on('then_inverse', adjustSortCriteria);
    
    simplePrefs.on('show_tools_menu_item', adjustMenuDisplay);
    simplePrefs.on('show_bookmarks_menu_item', adjustMenuDisplay);
    simplePrefs.on('show_bookmarks_toolbar_menu_item', adjustMenuDisplay);
    simplePrefs.on('show_bookmarks_manager_menu_item', adjustMenuDisplay);
    
    customizeObserver.on('done', function(window) {
        if(window.BookmarksMenuButton.button !== null) {
            addBookmarksButtonMenuItem(window.BookmarksMenuButton.button);
        }
    });
}

/**
 * Create the menus.
 */
function createMenus() {
    XulKey({
        id: KEY_ID,
        key: 'S',
        modifiers: 'accel alt shift',
        onCommand: sortAllBookmarks
    });
    
    let parentMenus = [{
        id: 'auto-sort-bookmarks-sort-all-tools-menu',
        menuid: 'menu_ToolsPopup'
    },
    {
        id: 'auto-sort-bookmarks-sort-all-bookmarks-menu',
        insertbefore: 'organizeBookmarksSeparator',
        menuid: 'bookmarksMenuPopup'
    },
    {
        id: 'auto-sort-bookmarks-sort-all-bookmarks-app-menu',
        insertafter: 'appmenu_showAllBookmarks',
        menuid: 'appmenu_bookmarksPopup'
    }];
    
    for(let parentMenu of parentMenus) {
        if(windowUtils.getMostRecentBrowserWindow().document.getElementById(parentMenu.menuid) !== null) {
            let options = {
                accesskey: _('sort_bookmarks.s'),
                key: KEY_ID,
                image: data.url('icon.png'),
                label: _('sort_bookmarks'),
                location: 'chrome://browser/content/browser.xul',
                onCommand: sortAllBookmarks,
                onInsert: adjustMenuDisplay
            };
            
            options = merge(options, parentMenu);
            
            Menuitem(options);
        }
    }
    
    createBookmarksButtonMenuItem();

    Menuitem({
        accesskey: _('sort_bookmarks.s'),
        id: 'auto-sort-bookmarks-sort-all-bookmarks-organiser-menu',
        image: data.url('icon.png'),
        insertafter: 'orgMoveBookmarks',
        key: KEY_ID,
        label: _('sort_bookmarks'),
        location: 'chrome://browser/content/places/places.xul',
        menuid: 'organizeButtonPopup',
        onCommand: sortAllBookmarks,
        onInsert: adjustMenuDisplay
    });
    
    adjustMenuDisplay();
}

/**
 * Create the widgets.
 */
function createWidgets(install) {
    createMenus();
    
    ToolbarButton({
        id: 'auto-sort-bookmarks-sort-all-toolbar',
        image: data.url('icon-22.png'),
        label: _('sort_bookmarks'),
        onCommand: sortAllBookmarks
    });
    
    if(install) {
        showConfirmation();
    }
}

/**
 * Unload function.
 */
function exit(reason) {
    if(reason === 'disable') {
        reset(getOptionName('firstrun'));
    }
}

/**
 * Auto-sort Bookmarks is a firefox extension that automatically sorts bookmarks.
 */
function main(options) {
    adjustFirstRun();
    migrateOptions(options.loadReason === 'install');
    createWidgets(options.loadReason === 'install');
    adjustSortCriteria();
    adjustAutoSort();
    createEvents();
    setPreferenceMinimumMaximum();
    adjustFirstRun();
}

/**
 * Migrate the old options.
 */
function migrateOptions(install) {
    let prefName = getOptionName('firstrun');
    
    if(!install && get(prefName)) {
        migratePreference('extensions.sortbookmarks.autosort', 'auto_sort', true);
        migratePreference('extensions.sortbookmarks.sortbar', 'sort_toolbar', true);
        migrateObjectPreference('extensions.sortbookmarks.order', {
            'folders': 'folder_sort_order',
            'liveBookmarks': 'livemark_sort_order',
            'smartBookmarks': 'smart_bookmark_sort_order',
            'bookmarks': 'bookmark_sort_order',
        }, {
            bookmarks: 4,
            folders: 1,
            liveBookmarks: 2, 
            smartBookmarks: 3
        });
    }
}

/**
 * On begin batch callback.
 */
function onBeginBatch() {
    bookmarkSorter.stop();
}

/**
 * On item change callback.
 */
function onChange(item, deleted, newFolder) {
    if(!deleted && !newFolder) {
        sortFolderOrItem(item);
    }
}

/**
 * On end batch callback.
 */
function onEndBatch() {
    bookmarkSorter.start();
}

/**
 * On item remove callback.
 */
function onRemove(item) {
    if(item instanceof Separator) {
        sortItemAfterDelay(item);
    }
}

/**
 * Remove the bookmark observer.
 */
function removeBookmarkObserver() {
    bookmarkManager.removeListener('begin-batch', onBeginBatch);
    bookmarkManager.removeListener('end-batch', onEndBatch);
    bookmarkManager.removeListener('add', sortFolderOrItem);
    bookmarkManager.removeListener('change', onChange);
    bookmarkManager.removeListener('move', sortFolderOrItem);
    bookmarkManager.removeListener('remove', onRemove);
    bookmarkManager.removeListener('visit', sortItemAfterDelay);
}

/**
 * Set the minimum and maximum of integer preferences.
 */
function setPreferenceMinimumMaximum() {
    let preferences = ['folder_sort_order', 'livemark_sort_order', 'smart_bookmark_sort_order', 'bookmark_sort_order'];
    for(let preference of preferences) {
        setPreferenceMinimum(preference, 1);
        setPreferenceMaximum(preference, 4);
    }
    setPreferenceMinimum('folder_delay', 3);
}

/**
 * Show confirmation on install.
 */
function showConfirmation() {
    var tabs = require("sdk/tabs");
    tabs.open({
        url: data.url('confirmation.html'),
        onOpen: function(tab) {
            tab.on('ready', function() {
                var worker = tab.attach({
                    contentScriptFile: data.url('confirmation.js')
                });
                worker.port.on('button-clicked', function(message) {
                    switch(message) {
                        case 'button-yes':
                            prefs.auto_sort = true;
                            break;
                        case 'button-no':
                            //Do nothing.
                            break;
                        case 'button-change-options':
                            showOptions();
                            break;
                    }
                    tab.close();
                });
                worker.port.emit('show', data.url('icon-48.png'));
            });
        }
    });
}

/**
 * Show the addon options.
 */
function showOptions() {
    windowUtils.getMostRecentBrowserWindow().BrowserOpenAddonsMgr('addons://detail/' + self.id + '/preferences');
}

/**
 * Sort the item with the folder delay if it is a folder; otherwise, sort it with the normal delay.
 * @param {Item} item The item to sort.
 */
function sortFolderOrItem(item) {
    if(item instanceof Folder) {
        sortItemAfterFolderDelay(item);
    }
    else {
        sortItemAfterDelay(item);
    }
}

/**
 * Sort `item` parent folder after the preferred delay.
 * @param {Item} item The item changed.
 */
function sortItemAfterDelay(item) {
    bookmarkSorter.sortFolders(item.getFolder(), prefs.delay * SECOND);
}

/**
 * Sort `item` parent folder after the folder delay.
 * @param {Item} item The item changed.
 */
function sortItemAfterFolderDelay(item) {
    bookmarkSorter.sortFolders(item.getFolder(), prefs.folder_delay * SECOND);
}

/**
 * Sort all bookmarks.
 */
function sortAllBookmarks() {
    bookmarkSorter.sortAllBookmarks();
}

/**
 * Sort if the auto sort option is on.
 */
function sortIfAuto() {
    if(prefs.auto_sort) {
        sortAllBookmarks();
    }
}

exports.main = main;
exports.onUnload = exit;

exports.adjustAutoSort = adjustAutoSort;
exports.adjustSortCriteria = adjustSortCriteria;
exports.createEvents = createEvents;
exports.createMenus = createMenus;
exports.migrateOptions = migrateOptions;
exports.setPreferenceMinimumMaximum = setPreferenceMinimumMaximum;
