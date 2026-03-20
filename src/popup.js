/*
 * Copyright (C) 2014-2015  Boucher, Antoni <bouanto@zoho.com>
 * Copyright (C) 2016-2022  Eric Bixby <ebixby@yahoo.com>
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

document.getElementById("btn-settings").textContent =
  browser.i18n.getMessage("settings");
document.getElementById("btn-configure-folders").textContent =
  browser.i18n.getMessage("configure_folders");
document.getElementById("btn-sort").textContent =
  browser.i18n.getMessage("sort");

document.getElementById("btn-settings").addEventListener("click", function () {
  browser.runtime.sendMessage({ action: "openSettings" });
  window.close();
});

document
  .getElementById("btn-configure-folders")
  .addEventListener("click", function () {
    browser.runtime.sendMessage({ action: "openConfigureFolders" });
    window.close();
  });

document.getElementById("btn-sort").addEventListener("click", function () {
  browser.runtime.sendMessage({ action: "sort" });
  window.close();
});
