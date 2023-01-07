/*
 * Copyright (C) 2014-2015  Boucher, Antoni <bouanto@zoho.com>
 * Copyright (C) 2016-2022  Eric Bixby <ebixby@yahoo.com>
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
 * Class for browser specific API calls.
 */
export default class BrowserUtil {
  /**
   * Converts a relative path within an extension install directory to a fully-qualified URL.
   *
   * @param {*} path A path to a resource within an extension expressed relative to its install directory.
   */
  static getExtensionURL(path) {
    chrome.extension.getURL(path);
  }

  /**
   * Registers an event listener callback to an event.
   *
   * @param callback Called when an event occurs.
   */
  static addBookmarkChangedListener(callback) {
    chrome.bookmarks.onChanged.addListener(callback);
  }

  /**
   * Registers an event listener callback to an event.
   *
   * @param callback Called when an event occurs.
   */
  static addBookmarkCreatedListener(callback) {
    chrome.bookmarks.onCreated.addListener(callback);
  }

  /**
   * Registers an event listener callback to an event.
   *
   * @param callback Called when an event occurs.
   */
  static addBookmarkMovedListener(callback) {
    chrome.bookmarks.onMoved.addListener(callback);
  }

  /**
   * Registers an event listener callback to an event.
   *
   * @param callback Called when an event occurs.
   */
  static addBookmarkRemovedListener(callback) {
    chrome.bookmarks.onRemoved.addListener(callback);
  }

  /**
   * Registers an event listener callback to an event.
   *
   * @param callback Called when an event occurs.
   */
  static addHistoryVistedListener(callback) {
    chrome.history.onVisited.addListener(callback);
  }

  /**
   * Deregisters an event listener callback from an event.
   *
   * @param callback Listener that shall be unregistered.
   */
  static removeBookmarkChangedListener(callback) {
    chrome.bookmarks.onChanged.removeListener(callback);
  }

  /**
   * Deregisters an event listener callback from an event.
   *
   * @param callback Listener that shall be unregistered.
   */
  static removeBookmarkCreatedListener(callback) {
    chrome.bookmarks.onCreated.removeListener(callback);
  }

  /**
   * Deregisters an event listener callback from an event.
   *
   * @param callback Listener that shall be unregistered.
   */
  static removeBookmarkMovedListener(callback) {
    chrome.bookmarks.onMoved.removeListener(callback);
  }

  /**
   * Deregisters an event listener callback from an event.
   *
   * @param callback Listener that shall be unregistered.
   */
  static removeBookmarkRemovedListener(callback) {
    chrome.bookmarks.onRemoved.removeListener(callback);
  }

  /**
   * Deregisters an event listener callback from an event.
   *
   * @param callback Listener that shall be unregistered.
   */
  static removeHistoryVistedListener(callback) {
    chrome.history.onVisited.removeListener(callback);
  }

  /**
   * Retrieves the children of the specified BookmarkTreeNode id.
   *
   * @param id BookmarkTreeNode id.
   * @param callback The callback parameter should be a function.
   */
  static getBookmarkChildren(id, callback) {
    chrome.bookmarks.getChildren(id, callback);
  }

  /**
   * Retrieves part of the Bookmarks hierarchy, starting at the specified node.
   *
   * @param id The ID of the root of the subtree to retrieve.
   * @param callback The callback parameter should be a function.
   */
  static getBookmarkSubTree(id, callback) {
    chrome.bookmarks.getSubTree(id, callback);
  }

  /**
   * Moves the specified BookmarkTreeNode to the provided location.
   *
   * @param id BookmarkTreeNode id.
   * @param destination Bookmark destination.
   * @returns The `move` method provides its result via callback or returned as a `Promise` (MV3 only).
   */
  static moveBookmark(id, destination) {
    return chrome.bookmarks.move(id, destination);
  }

  /**
   * Sets multiple items in storage.
   *
   * @param items An object which gives each key/value pair to update storage with.
   */
  static setLocalSettings(items) {
    browser.storage.local.set(items);
  }

  /**
   * Gets one or more items from storage.
   *
   * @param keys A single key to get, list of keys to get, or a dictionary specifying default values.
   */
  static getLocalSettings(keys) {
    return browser.storage.local.get(keys);
  }

  /**
   * Retrieves information about visits to a URL.
   *
   * @param details Details of item to retrieve.
   * @returns A 'Promise'
   */
  static getHistoryVisits(details) {
    return browser.history.getVisits(details);
  }
}
