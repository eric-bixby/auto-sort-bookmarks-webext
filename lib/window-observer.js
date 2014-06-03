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

const { Cc, Ci, Cu } = require('chrome'),
    { Class } = require('sdk/core/heritage'),
    { emit } = require('sdk/event/core'),
    { EventTarget } = require('sdk/event/target'),
    { when } = require('sdk/system/unload'),
    { merge } = require('sdk/util/object'),
    { isDocumentLoaded, windows } = require('sdk/window/utils'),
    windowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher);

/**
 * Window observer class.
 */
let WindowObserver = new Class({
    extends: EventTarget,
    /**
     * Create a window observer.
     */
    createObserver: function() {
        let target = this;
        
        let windowObserver = {
            observe: function(subject, topic, data) {
                if(topic === 'domwindowopened') {
                    emit(target, 'open', subject);
                    
                    subject.addEventListener('load', function() {
                        emit(target, 'load', subject);
                    });
                }
                else if(topic === 'domwindowclosed') {
                    emit(target, 'close', subject);
                }
            }
        };
        WindowObserver.prototype.observers.push(windowObserver);
        windowWatcher.registerNotification(windowObserver);
    },
    /**
     * Emit the load event for already opened windows.
     */
    emitForAlreadyOpenedWindows: function() {
        for(let window of windows()) {
            if(isDocumentLoaded(window)) {
                emit(this, 'load', window);
            }
        }
    },
    /**
     * Create a new window observer.
     * @constructor
     */
    initialize: function initialize(options) {
        EventTarget.prototype.initialize.call(this, options);
        merge(this, options);
        this.createObserver();
        this.emitForAlreadyOpenedWindows();
    }
});

WindowObserver.prototype.observers = [];

exports.WindowObserver = WindowObserver;

when(function() {
    for(let observer of WindowObserver.prototype.observers) {
        windowWatcher.unregisterNotification(observer);
    }
});
