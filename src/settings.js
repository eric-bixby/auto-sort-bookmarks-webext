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

const PREF_SCHEMA = [
  { name: "auto_sort", type: "boolean", defaultValue: false },
  {
    name: "delay",
    type: "integer",
    defaultValue: 3,
    minimum: 3,
    maximum: 255,
  },
  { name: "case_insensitive", type: "boolean", defaultValue: false },
  {
    name: "sort_by",
    type: "choice",
    defaultValue: "title",
    choices: [
      "title",
      "url",
      "dateAdded",
      "lastModified",
      "lastVisited",
      "accessCount",
      "revurl",
      "hostname",
    ],
  },
  { name: "inverse", type: "boolean", defaultValue: false },
  {
    name: "then_sort_by",
    type: "choice",
    defaultValue: "none",
    choices: [
      "none",
      "title",
      "url",
      "dateAdded",
      "lastModified",
      "lastVisited",
      "accessCount",
      "revurl",
      "hostname",
    ],
  },
  { name: "then_inverse", type: "boolean", defaultValue: false },
  {
    name: "folder_sort_by",
    type: "choice",
    defaultValue: "title",
    choices: ["none", "title"],
  },
  { name: "folder_inverse", type: "boolean", defaultValue: false },
  {
    name: "folder_sort_order",
    type: "integer",
    defaultValue: 1,
    minimum: 1,
    maximum: 2,
  },
  {
    name: "bookmark_sort_order",
    type: "integer",
    defaultValue: 2,
    minimum: 1,
    maximum: 2,
  },
];

let originalPrefs = {};

function i18n(key) {
  return browser.i18n.getMessage(key) || key;
}

function renderRow(schema, currentPrefs) {
  const label = i18n(`weh_prefs_label_${schema.name}`);
  const description = i18n(`weh_prefs_description_${schema.name}`);

  const row = document.createElement("tr");

  const labelCell = document.createElement("td");
  const lbl = document.createElement("label");
  lbl.htmlFor = `pref-${schema.name}`;
  lbl.textContent = label;
  labelCell.appendChild(lbl);

  const valueCell = document.createElement("td");
  let input;

  if (schema.type === "boolean") {
    input = document.createElement("input");
    input.type = "checkbox";
    input.id = `pref-${schema.name}`;
    input.checked = !!currentPrefs[schema.name];
  } else if (schema.type === "integer") {
    input = document.createElement("input");
    input.type = "number";
    input.id = `pref-${schema.name}`;
    input.min = schema.minimum;
    input.max = schema.maximum;
    input.value = currentPrefs[schema.name];
  } else if (schema.type === "choice") {
    input = document.createElement("select");
    input.id = `pref-${schema.name}`;
    schema.choices.forEach((choice) => {
      const option = document.createElement("option");
      option.value = choice;
      option.textContent = i18n(`weh_prefs_${schema.name}_option_${choice}`);
      if (choice === currentPrefs[schema.name]) {
        option.selected = true;
      }
      input.appendChild(option);
    });
  }

  input.addEventListener("change", updateButtons);
  valueCell.appendChild(input);

  if (description) {
    const desc = document.createElement("p");
    desc.className = "description";
    desc.textContent = description;
    valueCell.appendChild(desc);
  }

  row.appendChild(labelCell);
  row.appendChild(valueCell);
  return row;
}

function getFormValues() {
  const values = {};
  PREF_SCHEMA.forEach((schema) => {
    const input = document.getElementById(`pref-${schema.name}`);
    if (!input) {
      return;
    }
    if (schema.type === "boolean") {
      values[schema.name] = input.checked;
    } else if (schema.type === "integer") {
      values[schema.name] = parseInt(input.value, 10);
    } else {
      values[schema.name] = input.value;
    }
  });
  return values;
}

function isModified() {
  const current = getFormValues();
  return JSON.stringify(current) !== JSON.stringify(originalPrefs);
}

function isDefault() {
  const current = getFormValues();
  return PREF_SCHEMA.every(
    (schema) => current[schema.name] === schema.defaultValue
  );
}

function updateButtons() {
  const modified = isModified();
  document.getElementById("btn-cancel").disabled = !modified;
  document.getElementById("btn-save").disabled = !modified;
  document.getElementById("btn-reset").disabled = isDefault();
}

function renderForm(prefs) {
  originalPrefs = Object.assign({}, prefs);
  const tbody = document.getElementById("settings-rows");
  tbody.innerHTML = "";
  PREF_SCHEMA.forEach((schema) => tbody.appendChild(renderRow(schema, prefs)));
  updateButtons();
}

// Set static i18n text
document.title = i18n("settings");
document.getElementById("page-title").textContent = i18n("title");
document.getElementById("btn-configure-folders").textContent =
  i18n("configure_folders");
document.getElementById("btn-cancel").textContent = i18n("cancel");
document.getElementById("btn-reset").textContent = i18n("default");
document.getElementById("btn-save").textContent = i18n("save");

document
  .getElementById("btn-configure-folders")
  .addEventListener("click", function () {
    browser.runtime.sendMessage({ action: "openConfigureFolders" });
  });

document.getElementById("btn-cancel").addEventListener("click", function () {
  renderForm(originalPrefs);
});

document.getElementById("btn-reset").addEventListener("click", function () {
  browser.runtime.sendMessage({ action: "resetPrefs" }).then((defaultPrefs) => {
    renderForm(defaultPrefs);
  });
});

document.getElementById("btn-save").addEventListener("click", function () {
  const values = getFormValues();
  browser.runtime.sendMessage({ action: "setPrefs", prefs: values }).then(() => {
    originalPrefs = Object.assign({}, values);
    updateButtons();
  });
});

// Load current preferences from the background on page open
browser.runtime.sendMessage({ action: "getPrefs" }).then((prefs) => {
  renderForm(prefs);
});
