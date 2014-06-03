/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

exports.XulKey = function XulKey(options) {
  var delegate = {
    onTrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location) return;

      let doc = window.document;
      function $(id) doc.getElementById(id);
      function xul(type) doc.createElementNS(NS_XUL, type);

      var onCmd = function() {
        options.onCommand && options.onCommand();
      };

      var keyset = xul("keyset");

      // add hotkey
      var key = xul("key");
      key.setAttribute("id", options.id);
      key.setAttribute("key", options.key);
      if (options.modifiers)
        key.setAttribute("modifiers", options.modifiers);
      key.setAttribute("oncommand", "void(0);");
      key.addEventListener("command", onCmd, true);
      ($("mainKeyset") || $("mailKeys")).parentNode.appendChild(keyset).appendChild(key);

      // add unloader
      require("unload+").unload(function() {
        key.removeEventListener("command", onCmd, true); // must do for some reason..
        keyset.parentNode.removeChild(keyset);
      }, window);
    },
    onUntrack: function (window) {}
  };
  var winUtils = require("window-utils");
  var tracker = new winUtils.WindowTracker(delegate);
};
