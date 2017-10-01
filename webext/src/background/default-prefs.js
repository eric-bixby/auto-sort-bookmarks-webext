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

weh.prefs.declare([{
    name: "auto_sort",
    type: "boolean",
    defaultValue: false
}, {
    name: "delay",
    type: "integer",
    defaultValue: 0
}, {
    name: "folder_delay",
    type: "integer",
    defaultValue: 30
}, {
    name: "case_insensitive",
    type: "boolean",
    defaultValue: false
}, {
    name: "sort_by",
    type: "choice",
    defaultValue: "0",
    choices: [{
        name: "Name",
        value: "0"
    }, {
        name: "URL",
        value: "1"
    }, {
        name: "Description",
        value: "2"
    }, {
        name: "Keyword",
        value: "3"
    }, {
        name: "Date Added",
        value: "4"
    }, {
        name: "Last Modified",
        value: "5"
    }, {
        name: "Last visited",
        value: "6"
    }, {
        name: "Visited count",
        value: "7"
    }, {
        name: "Reversed URL",
        value: "8"
    }]
}, {
    name: "inverse",
    type: "boolean",
    defaultValue: false
}, {
    name: "then_sort_by",
    type: "choice",
    defaultValue: "-1",
    choices: [{
        name: "None",
        value: "-1"
    }, {
        name: "Name",
        value: "0"
    }, {
        name: "URL",
        value: "1"
    }, {
        name: "Description",
        value: "2"
    }, {
        name: "Keyword",
        value: "3"
    }, {
        name: "Date Added",
        value: "4"
    }, {
        name: "Last Modified",
        value: "5"
    }, {
        name: "Last visited",
        value: "6"
    }, {
        name: "Visited count",
        value: "7"
    }, {
        name: "Reversed URL",
        value: "8"
    }]
}, {
    name: "then_inverse",
    type: "boolean",
    defaultValue: false
}, {
    name: "folder_sort_by",
    type: "choice",
    defaultValue: "0",
    choices: [{
        name: "None",
        value: "-1"
    }, {
        name: "Name",
        value: "0"
    }, {
        name: "Description",
        value: "2"
    }, {
        name: "Date Added",
        value: "4"
    }, {
        name: "Last Modified",
        value: "5"
    }]
}, {
    name: "folder_inverse",
    type: "boolean",
    defaultValue: false
}, {
    name: "folder_sort_order",
    type: "integer",
    defaultValue: 1
}, {
    name: "livemark_sort_order",
    type: "integer",
    defaultValue: 2
}, {
    name: "smart_bookmark_sort_order",
    type: "integer",
    defaultValue: 3
}, {
    name: "bookmark_sort_order",
    type: "integer",
    defaultValue: 4
}]);
