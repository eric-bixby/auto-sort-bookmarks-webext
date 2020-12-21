/*
 * Copyright (C) 2014-2020  Boucher, Antoni <bouanto@zoho.com>
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

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, createStore, combineReducers } from "redux";
import {
  reducer as prefsSettingsReducer,
  App as PrefsSettingsApp,
  WehParam,
  WehPrefsControls,
  listenPrefs
} from "react/weh-prefs-settings";
import logger from "redux-logger";
import WehHeader from "react/weh-header";

import weh from "weh-content";

let reducers = combineReducers({
  prefs: prefsSettingsReducer
});

let store = createStore(reducers, applyMiddleware(logger));

listenPrefs(store);

/**
 * Open tab for configure folders.
 */
function openConfigureFolders() {
  weh.rpc.call("openConfigureFolders");
}

/**
 * Render controls.
 */
function RenderControls() {
  return (
    <div className="btn-toolbar justify-content-between">
      <div className="btn-group pull-left">
        <button
          type="button"
          onClick={openConfigureFolders}
          className="btn btn-default"
        >
          {weh._("configure_folders")}
        </button>
      </div>
      <div className="btn-group pull-right">
        <button
          type="button"
          onClick={this.props.cancel}
          className={
            "btn btn-default " + (this.props.flags.isModified ? "" : "disabled")
          }
        >
          {weh._("cancel")}
        </button>
        <button
          type="button"
          onClick={this.props.reset}
          className={
            "btn btn-warning " + (!this.props.flags.isDefault ? "" : "disabled")
          }
        >
          {weh._("default")}
        </button>
        <button
          type="button"
          onClick={this.props.save}
          className={
            "btn btn-primary " +
            (this.props.flags.isModified && this.props.flags.isValid
              ? ""
              : "disabled")
          }
        >
          {weh._("save")}
        </button>
      </div>
    </div>
  );
}

render(
  <Provider store={store}>
    <PrefsSettingsApp>
      <WehHeader />
      <main>
        <div className="container">
          <section>
            <WehParam prefName="auto_sort" />
            <WehParam prefName="delay" />
            <WehParam prefName="case_insensitive" />
            <WehParam prefName="sort_by" />
            <WehParam prefName="inverse" />
            <WehParam prefName="then_sort_by" />
            <WehParam prefName="then_inverse" />
            <WehParam prefName="folder_sort_by" />
            <WehParam prefName="folder_inverse" />
            <WehParam prefName="folder_sort_order" />
            <WehParam prefName="bookmark_sort_order" />
            <WehParam prefName="logging" />
          </section>
        </div>
      </main>
      <footer>
        <WehPrefsControls render={RenderControls} />
      </footer>
    </PrefsSettingsApp>
  </Provider>,
  document.getElementById("root")
);

weh.setPageTitle(weh._("settings"));
