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

function closeButtonClicked(event) {
    self.port.emit('close');
}

function checkboxClicked(event) {
    self.port.emit('do_not_show', event.target.checked);
}

let closeButton = document.querySelector('#close');
closeButton.addEventListener('click', closeButtonClicked, false);

let checkbox = document.querySelector('#do_not_show');
checkbox.addEventListener('click', checkboxClicked, false);
