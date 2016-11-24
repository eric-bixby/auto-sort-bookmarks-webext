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

/**
 * Handle button click event.
 * @param event
 */
function buttonClicked(event) {
    self.port.emit("button-clicked", event.target.id);
}

let yesButton = document.querySelector("#button-yes");
let noButton = document.querySelector("#button-no");
let optionsButton = document.querySelector("#button-change-options");

yesButton.addEventListener("click", buttonClicked, false);
noButton.addEventListener("click", buttonClicked, false);
optionsButton.addEventListener("click", buttonClicked, false);

self.port.on("show", function (iconURL) {
    let images = document.querySelectorAll("img");
    if (images.length === 0) {
        let image = new Image();
        image.alt = "Auto-Sort Bookmarks Icon";
        image.src = iconURL;
        document.body.insertBefore(image, document.querySelector("#question"));
    }
});
