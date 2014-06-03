/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, strict:true, undef:true, unused:true, curly:true, moz:true, indent:4, maxerr:50, globalstrict: true */
/*global require: false, exports: false */

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

const { Class } = require('sdk/core/heritage'),
    { emit } = require('sdk/event/core'),
    { EventTarget } = require('sdk/event/target'),
    { merge } = require('sdk/util/object'),
    { WindowObserver } = require('window-observer');

/**
 * Customize observer class.
 */
let CustomizeObserver = new Class({
    extends: EventTarget,
    /**
     * Create a customize observer.
     */
    createObserver: function() {
        let target = this;
        
        let windowObserver = new WindowObserver({
            onLoad: function(window) {
                if(window.BookmarksMenuButton !== undefined) {
                    window.BookmarksMenuButton.customizeDone = function() {
                        this.updatePosition();
                        emit(target, 'done', window);
                    };
                }
            }
        });
    },
    /**
     * Create a new customize observer.
     * @constructor
     */
    initialize: function initialize(options) {
        EventTarget.prototype.initialize.call(this, options);
        merge(this, options);
        this.createObserver();
    }
});

exports.CustomizeObserver = CustomizeObserver;
