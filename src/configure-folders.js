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

let addIcon;
let loadingText = "";
let messageText = "";
let recursiveText = "";
let removeIcon;
const fetching = new Set();

function sendCheckboxValue(type, folderID, checkbox, image) {
  return function handleEvent() {
    if (
      type === "recursive" &&
      image &&
      image.getAttribute("data-state") === "remove"
    ) {
      const children = document.querySelector(`#folder-${folderID}`);
      if (children) {
        children.style.display = "block";
      }
    }
    browser.runtime.sendMessage({
      action: `${type}CheckboxChange`,
      folderId: folderID,
      activated: checkbox.checked,
    });
  };
}

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
        browser.runtime
          .sendMessage({ action: "queryChildren", parentId: parentID })
          .then((response) => {
            appendFolders(response.children, children);
            fetching.delete(parentID);
          });
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

function appendFolder(folder, list) {
  const listItem = document.createElement("li");

  const recursiveCheckbox = document.createElement("input");
  const recursiveLabel = document.createElement("label");

  const children = document.createElement("ul");
  children.id = `folder-${folder.id}`;
  children.style.display = "none";

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
    sendCheckboxValue("sort", folder.id, checkbox),
    false
  );
  checkbox.addEventListener(
    "change",
    () => {
      if (checkbox.checked) {
        recursiveCheckbox.checked = false;
      }
      recursiveCheckbox.disabled = checkbox.checked;
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
    sendCheckboxValue("recursive", folder.id, recursiveCheckbox, icon),
    false
  );

  recursiveLabel.textContent = recursiveText;
  recursiveLabel.htmlFor = `recursive-${folder.id}`;
  recursiveLabel.className = "recursive";

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

function appendFolders(folders, list) {
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  folders.forEach((folder) => appendFolder(folder, list));
}

// Listen for removeFolder notifications pushed from the background script.
browser.runtime.onMessage.addListener(function (message) {
  if (message.action === "removeFolder") {
    const folderList = document.querySelector(`#folder-${message.id}`);
    if (folderList) {
      folderList.parentNode.parentNode.removeChild(folderList.parentNode);
    }
  }
});

// Set i18n text
document.title = browser.i18n.getMessage("configure_folders");
document.getElementById("page-title").textContent =
  browser.i18n.getMessage("title");
document.getElementById("page-description").textContent =
  browser.i18n.getMessage("uncheck_to_exclude_folder");

// Request root folders from the background on page load.
browser.runtime.sendMessage({ action: "queryRoot" }).then((response) => {
  recursiveText = response.texts.recursiveText;
  messageText = response.texts.messageText;
  loadingText = response.texts.loadingText;
  addIcon = response.addImgUrl;
  removeIcon = response.removeImgUrl;

  appendFolders(response.folders, document.getElementById("rootFolders"));
});
