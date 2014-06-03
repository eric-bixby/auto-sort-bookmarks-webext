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

const { get, reset } = require('sdk/preferences/service'),
    self = require('sdk/self'),
    simplePrefs = require('sdk/simple-prefs'),
    prefs = simplePrefs.prefs;

/**
 * Get the option long name from the `shortName`.
 * @param {string} The short name.
 * @return {string} The long name.
 */
function getOptionName(shortName) {
    return 'extensions.' + self.id + '.' + shortName;
}

/**
 * Migrate an old object preference to the new one.
 * @param {string} oldName The old complete name.
 * @param {Object.<string, string>} newNames The old object indexes and the new simple names.
 */
function migrateObjectPreference(oldName, newNames, oldDefaultValue) {
    let setting = get(oldName);
    if(setting === undefined) {
        setting = oldDefaultValue;
    }
    else {
        setting = JSON.parse(setting);
    }
    
    for(let index in newNames) {
        prefs[newNames[index]] = parseInt(setting[index], 10);
    }
}

/**
 * Migrate an old preference to the new one.
 * @param {string} oldName The old complete name.
 * @param {string} newName The new simple name.
 * @param {string|boolean|integer} oldDefaultValue The old default value.
 */
function migratePreference(oldName, newName, oldDefaultValue) {
    let setting = get(oldName);
    prefs[newName] = setting !== undefined ? setting : oldDefaultValue;
}

/**
 * Set the `maximum` of the `preference`.
 * @param {string} The preference name.
 * @param {integer} The maximum.
 */
function setPreferenceMaximum(preference, maximum) {
    simplePrefs.on(preference, function() {
        if(prefs[preference] > maximum) {
            prefs[preference] = maximum;
        }
    });
}

/**
 * Set the `minimum` of the `preference`.
 * @param {string} The preference name.
 * @param {integer} The minimum.
 */
function setPreferenceMinimum(preference, minimum) {
    simplePrefs.on(preference, function() {
        if(prefs[preference] < minimum) {
            prefs[preference] = minimum;
        }
    });
}

exports.getOptionName = getOptionName;
exports.migrateObjectPreference = migrateObjectPreference;
exports.migratePreference = migratePreference;
exports.setPreferenceMaximum = setPreferenceMaximum;
exports.setPreferenceMinimum = setPreferenceMinimum;
