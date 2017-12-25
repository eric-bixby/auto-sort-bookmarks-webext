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

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, createStore, combineReducers } from "redux";
import {
    reducer as prefsSettingsReducer,
    App as PrefsSettingsApp,
    listenPrefs
} from "react/weh-prefs-settings";
import logger from "redux-logger";
import WehHeader from "react/weh-header";

import weh from "weh-content";

let reducers = combineReducers({
    prefs: prefsSettingsReducer,
});

let store = createStore(reducers, applyMiddleware(logger));

listenPrefs(store);

let addIcon;
let loadingText = "";
let messageText = "";
let recursiveText = "";
let removeIcon;
let fetching = new Set();

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
    return function () {
        if (type === "recursive" && image.getAttribute("data-state") === "remove") {
            let children = document.querySelector("#folder-" + folderID);
            children.style.display = "block";
        }
        weh.rpc.call(type + "CheckboxChange", folderID, checkbox.checked);
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
    return function () {
        if (!fetching.has(parentID)) {
            if (image.getAttribute("data-state") === "add") {
                image.src = removeIcon;
                image.setAttribute("data-state", "remove");

                if (!recursiveCheckbox.checked) {
                    children.style.display = "block";
                    children.textContent = loadingText;
                }

                fetching.add(parentID);
                setTimeout(function () {
                    weh.rpc.call("queryChildren", parentID);
                }, 100);
            }
            else {
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
    let listItem = document.createElement("li");

    let recursiveCheckbox = document.createElement("input");
    let recursiveLabel = document.createElement("label");

    let children = document.createElement("ul");
    children.id = "folder-" + folder.id;

    let icon = document.createElement("img");
    icon.alt = "Expand/Collpase";
    icon.src = addIcon;
    icon.setAttribute("data-state", "add");
    icon.addEventListener("click", toggleChildren(folder.id, icon, children, recursiveCheckbox), false);

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "enable-" + folder.id;
    checkbox.checked = !folder.excluded;
    checkbox.addEventListener("change", sendValue("sort", folder.id, checkbox), false);
    checkbox.addEventListener("change", function () {
        // clear recursive checkbox when re-enabled
        if (checkbox.checked) {
            recursiveCheckbox.checked = false;
        }
        recursiveCheckbox.disabled = checkbox.checked;
        recursiveLabel.disabled = checkbox.checked;
    }, false);

    let label = document.createElement("label");
    label.textContent = folder.title;
    label.htmlFor = "enable-" + folder.id;
    label.className = "folder-title";
    label.addEventListener("click", toggleChildren(folder.id, icon, children, recursiveCheckbox), false);

    recursiveCheckbox.type = "checkbox";
    recursiveCheckbox.id = "recursive-" + folder.id;
    recursiveCheckbox.checked = folder.recursivelyExcluded;
    recursiveCheckbox.disabled = checkbox.checked;
    recursiveCheckbox.className = "recursive-checkbox";
    recursiveCheckbox.addEventListener("change", sendValue("recursive", folder.id, recursiveCheckbox, icon), false);

    recursiveLabel.textContent = recursiveText;
    recursiveLabel.htmlFor = "recursive-" + folder.id;
    recursiveLabel.className = "recursive";
    recursiveLabel.disabled = checkbox.checked;

    let message = document.createElement("p");
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
    for (let folder of folders) {
        appendFolder(folder, list);
    }
}

weh.rpc.listen({
    removeFolder: (folderID) => {
        let folder = document.querySelector("#folder-" + folderID);
        if (folder) {
            let parent = folder.parentNode;
            parent.parentNode.removeChild(parent);
        }
    },
    children: (parentID, children) => {
        let list = document.querySelector("#folder-" + parentID);
        appendFolders(children, list);
        fetching.delete(parentID);
    },
    root: (folders, plusIcon, minusIcon, texts) => {
        recursiveText = texts.recursiveText;
        messageText = texts.messageText;
        loadingText = texts.loadingText;

        addIcon = plusIcon;
        removeIcon = minusIcon;

        let rootFoldersDoc = document.querySelector("#rootFolders");

        appendFolders(folders, rootFoldersDoc);
    },
});

render(
    <Provider store={store}>
        <PrefsSettingsApp>
            <WehHeader />
            <main>
                <div className="container">
                    <ul id="rootFolders" />
                </div>
            </main>
        </PrefsSettingsApp>
    </Provider>,
    document.getElementById("root")
);

weh.setPageTitle(weh._("configure_folders"));
weh.rpc.call("queryRoot");
