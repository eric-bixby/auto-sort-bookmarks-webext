const sp = require("sdk/simple-prefs");

exports.setSyncLegacyDataPort = function (port) {
    // Send the initial data dump.
    port.postMessage({
        prefs: {
            superImportantUserPref: sp.prefs["superImportantUserPref"],
        },
    });
};
