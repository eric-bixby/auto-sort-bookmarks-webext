/*
 * Copyright (C) 2014-2017  Boucher, Antoni <bouanto@zoho.com>
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
import logger from "redux-logger";
import {
    reducer as translateReducer,
    WehTranslationForm
} from "react/weh-translation";

import weh from "weh-content";

let reducers = combineReducers({
    translate: translateReducer
});

let store = createStore(reducers, applyMiddleware(logger));

render(
    <Provider store={store}>
        <WehTranslationForm />
    </Provider>,
    document.getElementById("root")
);

weh.setPageTitle(weh._("translation"));
