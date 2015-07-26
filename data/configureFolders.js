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

let rootFolders = document.querySelector('#rootFolders');

function sendValue(folderID) {
    return function (event) {
        self.port.emit('checkbox-change', folderID, event.target.checked);
    };
}

self.port.on('folders', function(folders, foldersToExclude) {
    for(let folder of folders) {
        let listItem = document.createElement('li');

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
