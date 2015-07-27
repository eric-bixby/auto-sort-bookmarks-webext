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

let addIcon;
let foldersToExclude;
let messageText = '';
let recursiveText = '';
let removeIcon;

function sendValue(folderID, checkbox, recursiveCheckbox) {
    return function() {
        self.port.emit('checkbox-change', folderID, checkbox.checked, recursiveCheckbox.checked);
    };
}

function toggleChildren(parentID, image, children, recursiveCheckbox) {
    return function() {
        if(image.getAttribute('data-state') === 'add') {
            image.src = removeIcon;
            image.setAttribute('data-state', 'remove');

            while(children.firstChild) {
                children.removeChild(children.firstChild);
            }

            self.port.emit('query-children', parentID);

            if(!recursiveCheckbox.checked) {
                children.style.display = 'block';
            }
        }
        else {
            image.src = addIcon;
            image.setAttribute('data-state', 'add');

            if(children) {
                children.style.display = 'none';
            }
        }
    };
}

function findById(array, id) {
    for(let item of array) {
        if(item.id === id) {
            return item;
        }
    }

    return null;
}

function appendFolder(folder, list) {
    let listItem = document.createElement('li');

    let recursiveCheckbox = document.createElement('input');
    let recursiveLabel = document.createElement('label');

    let children = document.createElement('ul');
    children.id = 'folder-' + folder.id;

    let icon = document.createElement('img');
    icon.alt = 'plus-minus';
    icon.src = addIcon;
    icon.setAttribute('data-state', 'add');
    icon.addEventListener('click', toggleChildren(folder.id, icon, children, recursiveCheckbox), false);
    listItem.appendChild(icon);

    let label = document.createElement('label');
    label.textContent = folder.title;
    label.addEventListener('click', toggleChildren(folder.id, icon, children, recursiveCheckbox), false);
    listItem.appendChild(label);

    let excludedFolder = findById(foldersToExclude, folder.id);

    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = excludedFolder === null;
    checkbox.addEventListener('change', sendValue(folder.id, checkbox, recursiveCheckbox), false);
    checkbox.addEventListener('change', function() {
        recursiveCheckbox.disabled = checkbox.checked;
        recursiveLabel.disabled = checkbox.checked;
    }, false);

    listItem.appendChild(checkbox);

    recursiveLabel.textContent = recursiveText;
    recursiveLabel.htmlFor = 'recursive-' + folder.id;
    recursiveLabel.className = 'recursive';
    recursiveLabel.disabled = checkbox.checked;
    listItem.appendChild(recursiveLabel);

    let message = document.createElement('p');

    recursiveCheckbox.type = 'checkbox';
    recursiveCheckbox.id = 'recursive-' + folder.id;
    recursiveCheckbox.checked = excludedFolder !== null && excludedFolder.recursive === true;
    recursiveCheckbox.disabled = checkbox.checked;
    recursiveCheckbox.className = 'recursive-checkbox';
    recursiveCheckbox.addEventListener('change', sendValue(folder.id, checkbox, recursiveCheckbox), false);
    listItem.appendChild(recursiveCheckbox);

    message.textContent = messageText;
    listItem.appendChild(message);

    listItem.appendChild(children);

    list.appendChild(listItem);
}

function appendFolders(folders, list) {
    for(let folder of folders) {
        appendFolder(folder, list);
    }
}

self.port.on('children', function(parentID, children) {
    let list = document.querySelector('#folder-' + parentID);
    appendFolders(children, list);
});

self.port.on('update-excluded-folders', function(excludedFolders) {
    foldersToExclude = excludedFolders;
});

self.port.on('init', function(folders, excludedFolders, plusIcon, minusIcon) {
    recursiveText = document.querySelector('#recursive-text').textContent;
    messageText = document.querySelector('#message-text').textContent;
    addIcon = plusIcon;
    removeIcon = minusIcon;
    foldersToExclude = excludedFolders;

    let rootFolders = document.querySelector('#rootFolders');
    if(rootFolders === null) {
        rootFolders = document.createElement('ul');
        rootFolders.id = 'rootFolders';
        document.body.appendChild(rootFolders);
    }

    for(let folder of folders) {
        folder.title = document.querySelector('#' + folder.title).textContent;
    }

    appendFolders(folders, rootFolders);
});
