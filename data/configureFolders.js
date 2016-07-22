/*
 * Copyright (C) 2014-2016  Boucher, Antoni <bouanto@zoho.com>
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

let addIcon;
let loadingText = "";
let messageText = "";
let recursiveText = "";
let removeIcon;
let fetching = new Set();

function sendValue(type, folderID, checkbox, image) {
	return function() {
		if (type === "recursive" && image.getAttribute("data-state") === "remove") {
			let children = document.querySelector("#folder-" + folderID);
			children.style.display = "block";
		}
		self.port.emit(type + "-checkbox-change", folderID, checkbox.checked);
	};
}

function toggleChildren(parentID, image, children, recursiveCheckbox) {
	return function() {
		if (!fetching.has(parentID)) {
			if (image.getAttribute("data-state") === "add") {
				image.src = removeIcon;
				image.setAttribute("data-state", "remove");

				if (!recursiveCheckbox.checked) {
					children.style.display = "block";
					children.textContent = loadingText;
				}

				fetching.add(parentID);
				setTimeout(function() {
					self.port.emit("query-children", parentID);
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

function appendFolder(folder, list) {
	let listItem = document.createElement("li");

	let recursiveCheckbox = document.createElement("input");
	let recursiveLabel = document.createElement("label");

	let children = document.createElement("ul");
	children.id = "folder-" + folder.id;

	let icon = document.createElement("img");
	icon.alt = "plus-minus";
	icon.src = addIcon;
	icon.setAttribute("data-state", "add");
	icon.addEventListener("click", toggleChildren(folder.id, icon, children, recursiveCheckbox), false);
	listItem.appendChild(icon);

	let label = document.createElement("label");
	label.textContent = folder.title;
	label.addEventListener("click", toggleChildren(folder.id, icon, children, recursiveCheckbox), false);
	listItem.appendChild(label);

	let checkbox = document.createElement("input");
	checkbox.type = "checkbox";
	checkbox.checked = !folder.excluded;
	checkbox.addEventListener("change", sendValue("sort", folder.id, checkbox), false);
	checkbox.addEventListener("change", function() {
		recursiveCheckbox.disabled = checkbox.checked;
		recursiveLabel.disabled = checkbox.checked;
	}, false);

	listItem.appendChild(checkbox);

	recursiveLabel.textContent = recursiveText;
	recursiveLabel.htmlFor = "recursive-" + folder.id;
	recursiveLabel.className = "recursive";
	recursiveLabel.disabled = checkbox.checked;
	listItem.appendChild(recursiveLabel);

	let message = document.createElement("p");

	recursiveCheckbox.type = "checkbox";
	recursiveCheckbox.id = "recursive-" + folder.id;
	recursiveCheckbox.checked = folder.recursivelyExcluded;
	recursiveCheckbox.disabled = checkbox.checked;
	recursiveCheckbox.className = "recursive-checkbox";
	recursiveCheckbox.addEventListener("change", sendValue("recursive", folder.id, recursiveCheckbox, icon), false);
	listItem.appendChild(recursiveCheckbox);

	message.textContent = messageText;
	listItem.appendChild(message);

	listItem.appendChild(children);

	list.appendChild(listItem);
}

function appendFolders(folders, list) {
	while (list.firstChild) {
		list.removeChild(list.firstChild);
	}
	for (let folder of folders) {
		appendFolder(folder, list);
	}
}

self.port.on("remove-folder", function(folderID) {
	let folder = document.querySelector("#folder-" + folderID);
	if (folder) {
		let parent = folder.parentNode;
		parent.parentNode.removeChild(parent);
	}
});

self.port.on("children", function(parentID, children) {
	let list = document.querySelector("#folder-" + parentID);
	appendFolders(children, list);
	fetching.delete(parentID);
});

self.port.on("init", function(folders, plusIcon, minusIcon, texts) {
	recursiveText = texts.recursiveText;
	messageText = texts.messageText;
	loadingText = texts.loadingText;
	addIcon = plusIcon;
	removeIcon = minusIcon;

	let rootFolders = document.querySelector("#rootFolders");
	if (rootFolders === null) {
		rootFolders = document.createElement("ul");
		rootFolders.id = "rootFolders";
		document.body.appendChild(rootFolders);
	}

	appendFolders(folders, rootFolders);
});
