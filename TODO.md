# TODO
- [ ] Fix tests
- [ ] Add tests for new features: (including testing with corrupted bookmarks, folders, separators, ...)
- [ ] Add isRunning flag: set to true before sort and false after sort
- [ ] Store now() for change event, wait 30 seconds from last event (any/folder) before sorting
- [ ] Plural form unknown for locale "null":
    - [link1](https://github.com/mozilla/addon-sdk/blob/712a4874e0d1600cbb9d3311e79073dcf4ac14e1/lib/sdk/l10n/json/core.js#L35)
    - [link2](https://bugzilla.mozilla.org/show_bug.cgi?id=1103385)
- [ ] Use the Places Query API with the provided sort option
- [ ] Add coding style rule to disallow space before comma
- [ ] Add coding style rule to disallow writing "function\* ()"
- [ ] Whenever an option is changed, call "sortIfAuto()"
- [ ] Translate the options in French
- [ ] Only delay the folder sort for new folder when the user is in the new bookmark dialog
- [ ] Add bookmark observer to log the actions for debugging

