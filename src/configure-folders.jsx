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

/* eslint-disable no-param-reassign */

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, createStore, combineReducers } from "redux";
import {
  reducer as prefsSettingsReducer,
  App as PrefsSettingsApp,
  listenPrefs,
} from "react/weh-prefs-settings";
import logger from "redux-logger";
import WehHeader from "react/weh-header";
import weh from "weh-content";

const reducers = combineReducers({
  prefs: prefsSettingsReducer,
});

const store = createStore(reducers, applyMiddleware(logger));

listenPrefs(store);

let addIcon;
let loadingText = "";
let messageText = "";
let recursiveText = "";
let removeIcon;
const fetching = new Set();

/**
 * Send value.
 *
 * @param type
 * @param folderID
 * @param checkbox
 * @param image
 * @returns {Function}
 */
function sendValue(type, folderID, checkbox, image) {
  return function handleEvent() {
    if (type === "recursive" && image.getAttribute("data-state") === "remove") {
      const children = document.querySelector(`#folder-${folderID}`);
      children.style.display = "block";
    }
    weh.rpc.call(`${type}CheckboxChange`, folderID, checkbox.checked);
  };
}

/**
 * Toggle children.
 *
 * @param parentID
 * @param image
 * @param children
 * @param recursiveCheckbox
 * @returns {Function}
 */
function toggleChildren(parentID, image, children, recursiveCheckbox) {
  return function handleEvent() {
    if (!fetching.has(parentID)) {
      if (image.getAttribute("data-state") === "add") {
        image.src = removeIcon;
        image.setAttribute("data-state", "remove");

        if (!recursiveCheckbox.checked) {
          children.style.display = "block";
          children.textContent = loadingText;
        }

        fetching.add(parentID);
        setTimeout(() => {
          weh.rpc.call("queryChildren", parentID);
        }, 100);
      } else {
        image.src = addIcon;
        image.setAttribute("data-state", "add");

        if (children) {
          children.style.display = "none";
        }
      }
    }
  };
}

/**
 * Append folder.
 *
 * @param folder
 * @param list
 */
function appendFolder(folder, list) {
  const listItem = document.createElement("li");

  const recursiveCheckbox = document.createElement("input");
  const recursiveLabel = document.createElement("label");

  const children = document.createElement("ul");
  children.id = `folder-${folder.id}`;

  const icon = document.createElement("img");
  icon.alt = "Expand/Collapse";
  icon.src = addIcon;
  icon.setAttribute("data-state", "add");
  icon.addEventListener(
    "click",
    toggleChildren(folder.id, icon, children, recursiveCheckbox),
    false
  );

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `enable-${folder.id}`;
  checkbox.checked = !folder.excluded;
  checkbox.addEventListener(
    "change",
    sendValue("sort", folder.id, checkbox),
    false
  );
  checkbox.addEventListener(
    "change",
    () => {
      // clear recursive checkbox when re-enabled
      if (checkbox.checked) {
        recursiveCheckbox.checked = false;
      }
      recursiveCheckbox.disabled = checkbox.checked;
      recursiveLabel.disabled = checkbox.checked;
    },
    false
  );

  const label = document.createElement("label");
  label.textContent = folder.title;
  label.htmlFor = `enable-${folder.id}`;
  label.className = "folder-title";
  label.addEventListener(
    "click",
    toggleChildren(folder.id, icon, children, recursiveCheckbox),
    false
  );

  recursiveCheckbox.type = "checkbox";
  recursiveCheckbox.id = `recursive-${folder.id}`;
  recursiveCheckbox.checked = folder.recursivelyExcluded;
  recursiveCheckbox.disabled = checkbox.checked;
  recursiveCheckbox.className = "recursive-checkbox";
  recursiveCheckbox.addEventListener(
    "change",
    sendValue("recursive", folder.id, recursiveCheckbox, icon),
    false
  );

  recursiveLabel.textContent = recursiveText;
  recursiveLabel.htmlFor = `recursive-${folder.id}`;
  recursiveLabel.className = "recursive";
  recursiveLabel.disabled = checkbox.checked;

  const message = document.createElement("p");
  message.textContent = messageText;

  listItem.appendChild(icon);
  listItem.appendChild(checkbox);
  listItem.appendChild(label);
  listItem.appendChild(recursiveCheckbox);
  listItem.appendChild(recursiveLabel);
  listItem.appendChild(message);
  listItem.appendChild(children);

  list.appendChild(listItem);
}

/**
 * Append folders.
 *
 * @param folders
 * @param list
 */
function appendFolders(folders, list) {
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  folders.forEach((folder) => appendFolder(folder, list));
}

weh.rpc.listen({
  removeFolder: (folderID) => {
    const folder = document.querySelector(`#folder-${folderID}`);
    if (folder) {
      const parent = folder.parentNode;
      parent.parentNode.removeChild(parent);
    }
  },
  children: (parentID, children) => {
    const list = document.querySelector(`#folder-${parentID}`);
    appendFolders(children, list);
    fetching.delete(parentID);
  },
  root: (folders, plusIcon, minusIcon, texts) => {
    recursiveText = texts.recursiveText;
    messageText = texts.messageText;
    loadingText = texts.loadingText;

    addIcon = plusIcon;
    removeIcon = minusIcon;

    const rootFoldersDoc = document.querySelector("#rootFolders");

    appendFolders(folders, rootFoldersDoc);
  },
});

render(
  <Provider store={store}>
    <PrefsSettingsApp>
      <WehHeader />
      <main>
        <div className="container">
          <b>{weh._("folders_to_sort")}</b>
          <p>{weh._("uncheck_to_exclude_folder")}</p>
          <ul id="rootFolders" />
        </div>
      </main>
    </PrefsSettingsApp>
  </Provider>,
  document.getElementById("root")
);

weh.setPageTitle(weh._("configure_folders"));
weh.rpc.call("queryRoot");
