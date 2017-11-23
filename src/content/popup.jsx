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

"use strict";

class Link extends React.Component {

    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        weh.post({
            type: this.props.messageType
        });
    }

    render() {
        return (
            <button onClick={this.handleClick}>{weh._(this.props.label)}</button>
        )
    }
}

ReactDOM.render(
    <div>
        <div className="asb-toolbar">
            <Link messageType={"sort"} label={"sort"} />
            <Link messageType={"open-settings"} label={"settings"} />
        </div>
    </div>,
    document.getElementById('root')
)
