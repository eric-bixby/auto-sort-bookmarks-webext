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

"use strict";

function Prefs() {
    return (
        <WehParams>
            <WehVersion />
            <WehParamSet wehPrefs={["auto_sort", "delay", "folder_delay", "case_insensitive", "sort_by", "inverse", "then_sort_by", "then_inverse", "folder_sort_by", "folder_inverse", "folder_sort_order", "livemark_sort_order", "smart_bookmark_sort_order", "bookmark_sort_order"]}>
                <WehParam />
            </WehParamSet>
        </WehParams>
    )
}

ReactDOM.render(
    <div>
        <h1 className="text-center">{weh._("title")} :: {weh._("settings")}</h1>
        <br />
        <Prefs />
    </div>,
    document.getElementById('root')
)

weh.setPageTitle(weh._("settings"));
