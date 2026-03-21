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

class BrowserUtil {
  static getExtensionURL(path) {
    return browser.runtime.getURL(path);
  }

  static addBookmarkChangedListener(callback) {
    browser.bookmarks.onChanged.addListener(callback);
  }

  static addBookmarkCreatedListener(callback) {
    browser.bookmarks.onCreated.addListener(callback);
  }

  static addBookmarkMovedListener(callback) {
    browser.bookmarks.onMoved.addListener(callback);
  }

  static addBookmarkRemovedListener(callback) {
    browser.bookmarks.onRemoved.addListener(callback);
  }

  static addHistoryVistedListener(callback) {
    browser.history.onVisited.addListener(callback);
  }

  static removeBookmarkChangedListener(callback) {
    browser.bookmarks.onChanged.removeListener(callback);
  }

  static removeBookmarkCreatedListener(callback) {
    browser.bookmarks.onCreated.removeListener(callback);
  }

  static removeBookmarkMovedListener(callback) {
    browser.bookmarks.onMoved.removeListener(callback);
  }

  static removeBookmarkRemovedListener(callback) {
    browser.bookmarks.onRemoved.removeListener(callback);
  }

  static removeHistoryVistedListener(callback) {
    browser.history.onVisited.removeListener(callback);
  }

  static getBookmarkChildren(id) {
    return browser.bookmarks.getChildren(id);
  }

  static getBookmarkSubTree(id) {
    return browser.bookmarks.getSubTree(id);
  }

  static moveBookmark(id, destination) {
    return browser.bookmarks.move(id, destination);
  }

  static setLocalSettings(items) {
    return browser.storage.local.set(items);
  }

  static getLocalSettings(keys) {
    return browser.storage.local.get(keys);
  }

  static getHistoryVisits(details) {
    return browser.history.getVisits(details);
  }
}
