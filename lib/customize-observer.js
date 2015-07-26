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

'use strict';

const { Class } = require('sdk/core/heritage');
const { emit } = require('sdk/event/core');
const { EventTarget } = require('sdk/event/target');
const { merge } = require('sdk/util/object');
const { WindowObserver } = require('window-observer');

/**
 * Customize observer class.
 */
let CustomizeObserver = new Class({
    extends: EventTarget,
    /**
     * Create a customize observer.
     */
    createObserver: function() {
        let self = this;

        new WindowObserver({
            onLoad: function(window) {
                if(window.BookmarksMenuButton !== undefined) {
                    window.BookmarksMenuButton.customizeDone = function() {
                        this.updatePosition();
                        emit(self, 'done', window);
                    };
                }
            }
        });
    },
    /**
     * Create a new customize observer.
     * @constructor
     */
    initialize: function(options) {
        EventTarget.prototype.initialize.call(this, options);
        merge(this, options);
        this.createObserver();
    },
});

exports.CustomizeObserver = CustomizeObserver;
