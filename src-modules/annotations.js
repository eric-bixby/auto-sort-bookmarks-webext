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

"use strict";

/* global module */

const DONOTSORT = "donotsort", RECURSIVE = "recursive";

var self = module.exports = {

    /**
     * If enabled, send message to console for debugging.
     *
     * @param {*} o Message to display on console.
     */
    log: function (o) {
        // enable for debugging, disable prior to release.
        var logging = true;
        if (logging) {
            console.log(o);
        }
    },

    /**
     * Get DoNotSort Annotation Map.
     * 
     * @param {*} callback.
     */
    getDoNotSortAnnotationMap: function (callback) {
        self.getStoredAnnotationMap(DONOTSORT, callback);
    },

    /**
     * Get Recursive Annotation Map.
     * 
     * @param {*} callback.
     */
    getRecursiveAnnotationMap: function (callback) {
        self.getStoredAnnotationMap(RECURSIVE, callback);
    },

    /**
     * Get stored annotation map.
     *
     * @param {string} name The item name.
     * @param {*} callback Callback to send annotation to.
     */
    getStoredAnnotationMap: function (name, callback) {
        var getting = browser.storage.local.get(name);
        getting.then(storedSettings => {
            self.log(storedSettings);
            // var map = JSON.parse(storedSettings[name] || "{}");
            var map = storedSettings[name] || new Map();
            self.log(map);
            if (typeof callback === "function") {
                callback(map);
            }
        });
    },

    /**
     * Remove an item annotation.
     *
     * @param {string} id The item ID.
     * @param {string} name The item name.
     */
    removeItemAnnotation: function (id, name) {
        self.getStoredAnnotationMap(name, function (map) {
            if (map[id] !== undefined) {
                delete map[id];
            }
            self.setStoredAnnotationMap(name, map);
        });
    },

    /**
     * Remove folders that no longer exist.
     * 
     * @param {array} folders The current existing folders.
     */
    removeMissingFolders: function (folders) {
        self.removeMissingFoldersForItem(folders, DONOTSORT);
        self.removeMissingFoldersForItem(folders, RECURSIVE);
    },

    /**
     * Remove folders that no longer exist.
     * 
     * @param {array} folders The current existing folders.
     * @param {string} name Name of storage item.
     */
    removeMissingFoldersForItem: function (folders, name) {
        self.getStoredAnnotationMap(name, function (map) {
            for (var key of Object.keys(map)) {
                var found = false;
                for (let folder of folders) {
                    if (folder.id === key) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    delete map[key];
                }
            }
            self.setStoredAnnotationMap(name, map);
        });
    },

    /**
     * Remove the do not sort annotation on an item.
     *
     * @param {string} id The item ID.
     */
    removeDoNotSortAnnotation: function (id) {
        self.removeItemAnnotation(id, DONOTSORT);
    },

    /**
     * Remove the recursive annotation on an item.
     *
     * @param {string} id The item ID.
     */
    removeRecursiveAnnotation: function (id) {
        self.removeItemAnnotation(id, RECURSIVE);
    },

    /**
     * Set an item annotation.
     *
     * @param {string} id The item ID.
     * @param name The item name.
     * @param value The item value.
     */
    setItemAnnotation: function (id, name, value) {
        self.getStoredAnnotationMap(name, function (map) {
            map[id] = value;
            self.setStoredAnnotationMap(name, map);
        });
    },

    /**
     * Set the do not sort annotation on an item.
     * 
     * @param {string} id The item ID.
     */
    setDoNotSortAnnotation: function (id) {
        self.setItemAnnotation(id, DONOTSORT, true);
    },

    /**
     * Set the recursive annotation on an item.
     * 
     * @param {string} id The item ID.
     */
    setRecursiveAnnotation: function (id) {
        self.setItemAnnotation(id, RECURSIVE, true);
    },

    /**
     * Set the stored annotation.
     * 
     * @param {string} name Key to save map to.
     * @param {*} map Map to be saved.
     */
    setStoredAnnotationMap: function (name, map) {
        var settings = {};
        // settings[name] = JSON.stringify(map);
        settings[name] = map;
        self.log(settings);
        browser.storage.local.set(settings);
    }
};
