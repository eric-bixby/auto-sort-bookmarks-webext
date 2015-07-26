/*
 * Copyright (C) 2015  Boucher, Antoni <bouanto@gmail.com>
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

/*
 * TODO: if I delete a folder, remove it from the preference.
 * TODO: add a recursive option.
 * TODO: update the migration to use the recursive option.
 */

'use strict';

let addIcon;
let removeIcon;

function sendValue(folderID) {
    return function(event) {
        self.port.emit('checkbox-change', folderID, event.target.checked);
    };
}

function toggleChildren(parentID) {
    return function(event) {
        let image = event.target;
        let children = image.nextSibling.nextSibling.nextSibling;
        if(image.getAttribute('data-state') === 'add') {
            image.src = removeIcon;
            image.setAttribute('data-state', 'remove');

            if(!children) {
                children = document.createElement('ul');
                image.parentNode.appendChild(children);
            }
            else {
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

self.port.on('init', function(folders, foldersToExclude, plusIcon, minusIcon) {
    addIcon = plusIcon;
    removeIcon = minusIcon;
    let rootFolders = document.querySelector('#rootFolders');
    if(rootFolders === null) {
        rootFolders = document.createElement('ul');
        rootFolders.id = 'rootFolders';
        document.body.appendChild(rootFolders);
    }

    for(let folder of folders) {
        let listItem = document.createElement('li');

        let icon = document.createElement('img');
        icon.alt = 'plus-minus';
        icon.src = plusIcon;
        icon.setAttribute('data-state', 'add');
        icon.addEventListener('click', toggleChildren(folder.id), false);
        listItem.appendChild(icon);

        let label = document.createElement('label');
        label.htmlFor = 'folder-' + folder.id;
        label.textContent = folder.title;
        listItem.appendChild(label);

        let checkbox = document.createElement('input');
        checkbox.id = 'folder-' + folder.id;
        checkbox.type = 'checkbox';
        checkbox.checked = foldersToExclude.indexOf(folder.id) < 0;
        checkbox.addEventListener('change', sendValue(folder.id), false);
        listItem.appendChild(checkbox);

        rootFolders.appendChild(listItem);
    }
});
