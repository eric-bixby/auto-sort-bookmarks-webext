/*
 * Copyright (C) 2014  Boucher, Antoni <bouanto@zoho.com>
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
const timers = require('sdk/timers');

/**
 * Thread class.
 */
let Thread = new Class({
	/**
	 * Execute once the thread generator.
	 */
	execute: function() {
		let self = this;
		if(this.running && !this.finish && this.generator.next()) {
			timers.setTimeout(function() {
				self.execute();
			}, 0);
		}
		else if(this.running) {
			this.finish = true;
		}
	},

	finish: true,
	/**
	 * Create a new thread.
	 * @param {Function} callback The generator to execute asynchronously.
	 * @constructor
	 */
	initialize: function(callback, time) {
		this.generator = callback.apply(null, Array.prototype.slice.call(arguments, 1));
		this.sleep(time, true);
	},

	running: false,
	/**
	 * Stop the thread for `time` milliseconds.
	 * @param {int} time The sleep time in milliseconds.
	 */
	sleep: function(time, first) {
		let self = this;
		this.stop();
		timers.setTimeout(function() {
			self.start(first);
		}, time);
	},
	/**
	 * Start the thread.
	 * @param {boolean} first Whether it is the first start or not.
	 */
	start: function(first) {
		first = first || false;

		if(!this.finish || first) {
			this.finish = false;
			this.running = true;
			this.execute();
		}
	},
	/**
	 * Stop the thread.
	 */
	stop: function() {
		this.running = false;
	},
});

exports.Thread = Thread;
