/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const userstyles = require('userstyles');
const { Loader } = require("test-harness/loader");

const TEST_CSS_URL = module.uri.replace(/\.js$/, ".css");
const TEST_FNF_URL = module.uri.replace(/\.js$/, ".x.css");

// TEST: userstyles.load
exports.testLoad = function(test) {
  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');

  userstyles.load(TEST_CSS_URL);
  test.assert(userstyles.registered(TEST_CSS_URL), 'css was registered.');

  userstyles.unload(TEST_CSS_URL);
  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css was unregistered.');
};

// TEST: userstyles.load file not found
exports.testLoadFNF = function(test) {
  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css is not registered.');

  try {
    userstyles.load(TEST_FNF_URL);
    test.fail('trying to load a file that does not exist should throw an error');
 }
 catch(e) {
   test.pass('trying to load a file that does not exist throws an error');
 }

  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css was not registered.');
};

// TEST: userstyles.load for 'agent' type
exports.testLoadAgent = function(test) {
  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css is not registered.');
  test.assertEqual(userstyles.registered(TEST_CSS_URL, {type: 'agent'}), false, 'css is not registered.');

  userstyles.load(TEST_CSS_URL, {type: 'AgeNt'});
  test.assert(userstyles.registered(TEST_CSS_URL, {type: 'AGENT'}), 'css was registered.');

  try {
    userstyles.unload(TEST_CSS_URL);
    test.fail('unregister did not throw an error');
  }
  catch(e) {
    test.pass('unregister did throw an error');
  }
  test.assertEqual(userstyles.registered(TEST_CSS_URL, {type: 'agent'}), true, 'css was not unregistered.');

  userstyles.unload(TEST_CSS_URL, {type: 'agent'});
  test.assertEqual(userstyles.registered(TEST_CSS_URL, {type: 'agent'}), false, 'css was unregistered.');
};

exports.testUnload = function(test) {
  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css is unregistered.');
  let loader = Loader(module);
  loader.require('userstyles').load(TEST_CSS_URL);
  test.assert(userstyles.registered(TEST_CSS_URL), 'css was registered.');
  loader.unload();
  test.assertEqual(userstyles.registered(TEST_CSS_URL), false, 'css was unregistered.');
}
