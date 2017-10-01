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

/*
 * Popup panel that opens from a toolbar button.
*/
weh.ui.update("default", {
    type: "popup",
    onMessage: function (message) {
        switch (message.type) {
            case "open-settings":
                weh.ui.close("default");
                weh.ui.open("settings");
                break;
        }
    }
});

/*
 * Tab for settings.
 */
weh.ui.update("settings", {
    type: "tab",
    contentURL: "content/settings.html"
});
