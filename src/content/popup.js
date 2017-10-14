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

/* global weh, angular */

// initialize list
angular.module("skeleton", []);

// register directive factory
angular.module("skeleton").directive("skelLink", function () {
    return {
        template: function (elem, attr) {
            return `
                <a
                    ng-click="post({type: '${attr.messagetype}' })">
                    ${attr.label}
                </a>
            `;
        }
    };
});

// register controller
angular.module("skeleton").controller("SkelCtrl", ["$scope", function ($scope) {
    // in case you need a controller to do stuff
}]);

// bootstrap angular
weh.ngBootstrap("skeleton");
