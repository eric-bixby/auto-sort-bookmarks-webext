// AsbPrefs is a singleton IIFE that registers a message listener at load time.
// We need to set up globals before requiring it, and capture the listener.

global.AsbUtil = { log: jest.fn() };
global.Annotations = {
  init: jest.fn(),
  setDoNotSortAnnotation: jest.fn(),
  removeDoNotSortAnnotation: jest.fn(),
  setRecursiveAnnotation: jest.fn(),
  removeRecursiveAnnotation: jest.fn(),
};
global.FolderUtil = {
  getChildrenFolders: jest.fn().mockResolvedValue([]),
};

// Require AsbPrefs — this runs the IIFE and calls browser.runtime.onMessage.addListener
const AsbPrefs = require("../../src/AsbPrefs");

// Capture the message listener that was registered during module load
const messageListener =
  browser.runtime.onMessage.addListener.mock.calls[0][0];

beforeEach(() => {
  // Reset prefs to defaults by loading empty storage
  browser.storage.local.get.mockResolvedValue({});
});

describe("AsbPrefs.getPref / setPref", () => {
  test("returns default value for unset pref", () => {
    expect(AsbPrefs.getPref("auto_sort")).toBe(false);
    expect(AsbPrefs.getPref("delay")).toBe(3);
    expect(AsbPrefs.getPref("sort_by")).toBe("title");
  });

  test("setPref updates value and persists to storage", () => {
    AsbPrefs.setPref("delay", 10);
    expect(AsbPrefs.getPref("delay")).toBe(10);
    expect(browser.storage.local.set).toHaveBeenCalled();
  });
});

describe("AsbPrefs.getAllPrefs", () => {
  test("returns all default prefs", () => {
    const all = AsbPrefs.getAllPrefs();
    expect(all).toHaveProperty("auto_sort");
    expect(all).toHaveProperty("delay");
    expect(all).toHaveProperty("sort_by");
    expect(all).toHaveProperty("case_insensitive");
    expect(all).toHaveProperty("sort_folders_first");
  });
});

describe("AsbPrefs.getFolderOrder / getBookmarkOrder", () => {
  test("folders first: folder=1, bookmark=2", () => {
    AsbPrefs.setPref("sort_folders_first", true);
    expect(AsbPrefs.getFolderOrder()).toBe(1);
    expect(AsbPrefs.getBookmarkOrder()).toBe(2);
  });

  test("bookmarks first: folder=2, bookmark=1", () => {
    AsbPrefs.setPref("sort_folders_first", false);
    expect(AsbPrefs.getFolderOrder()).toBe(2);
    expect(AsbPrefs.getBookmarkOrder()).toBe(1);
  });
});

describe("AsbPrefs.getRootId", () => {
  test("returns the Firefox root bookmark ID", () => {
    expect(AsbPrefs.getRootId()).toBe("root________");
  });
});

describe("AsbPrefs.load", () => {
  test("calls Annotations.init with storage data", async () => {
    const storageData = {
      prefs: { delay: 5 },
      donotsort: { "folder-1": true },
    };
    browser.storage.local.get.mockResolvedValue(storageData);

    await new Promise((resolve) => AsbPrefs.load(resolve));

    expect(global.Annotations.init).toHaveBeenCalledWith(storageData);
    expect(AsbPrefs.getPref("delay")).toBe(5);
  });

  test("uses defaults when no prefs in storage", async () => {
    // Reset prefs via the resetPrefs message handler first
    const sendResponse = jest.fn();
    messageListener({ action: "resetPrefs" }, {}, sendResponse);

    browser.storage.local.get.mockResolvedValue({});
    await new Promise((resolve) => AsbPrefs.load(resolve));

    // Prefs remain at defaults since storage had no prefs key
    expect(AsbPrefs.getPref("delay")).toBe(3);
    expect(AsbPrefs.getPref("auto_sort")).toBe(false);
  });
});

describe("AsbPrefs.setSorter / adjustSortCriteria", () => {
  test("adjustSortCriteria does nothing without a sorter", () => {
    AsbPrefs.setSorter(null);
    expect(() => AsbPrefs.adjustSortCriteria()).not.toThrow();
  });

  test("adjustSortCriteria calls sorter.setCriteria", () => {
    const mockSorter = { setCriteria: jest.fn(), sortIfAuto: jest.fn() };
    AsbPrefs.setSorter(mockSorter);
    AsbPrefs.adjustSortCriteria();
    expect(mockSorter.setCriteria).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: expect.any(String),
        inverse: expect.any(Boolean),
      })
    );
  });
});

describe("AsbPrefs.removeFolder", () => {
  test("sends removeFolder message to settings tabs", async () => {
    const tabs = [{ id: 1 }, { id: 2 }];
    browser.tabs.query.mockResolvedValue(tabs);

    AsbPrefs.removeFolder("folder-42");

    // Wait for the promise chain to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(browser.tabs.query).toHaveBeenCalledWith({
      url: expect.stringContaining("settings.html"),
    });
    expect(browser.tabs.sendMessage).toHaveBeenCalledTimes(2);
    expect(browser.tabs.sendMessage).toHaveBeenCalledWith(1, {
      action: "removeFolder",
      id: "folder-42",
    });
  });
});

describe("message handler — getPrefs", () => {
  test("responds with all prefs", () => {
    const sendResponse = jest.fn();
    messageListener({ action: "getPrefs" }, {}, sendResponse);
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ auto_sort: expect.any(Boolean) })
    );
  });
});

describe("message handler — setPrefs", () => {
  test("updates prefs and responds with success", () => {
    const sendResponse = jest.fn();
    messageListener(
      { action: "setPrefs", prefs: { delay: 7 } },
      {},
      sendResponse
    );
    expect(AsbPrefs.getPref("delay")).toBe(7);
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});

describe("message handler — resetPrefs", () => {
  test("resets to defaults and responds with default values", () => {
    AsbPrefs.setPref("delay", 99);
    const sendResponse = jest.fn();
    messageListener({ action: "resetPrefs" }, {}, sendResponse);
    const response = sendResponse.mock.calls[0][0];
    expect(response.delay).toBe(3);
    expect(response.auto_sort).toBe(false);
  });
});

describe("message handler — sort", () => {
  test("calls sorter.sortNow when sorter is set", () => {
    const mockSorter = {
      setCriteria: jest.fn(),
      sortNow: jest.fn(),
      sortIfAuto: jest.fn(),
    };
    AsbPrefs.setSorter(mockSorter);
    const sendResponse = jest.fn();
    messageListener({ action: "sort" }, {}, sendResponse);
    expect(mockSorter.sortNow).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
});

describe("message handler — sortCheckboxChange", () => {
  test("activated: removes annotations", () => {
    const sendResponse = jest.fn();
    messageListener(
      { action: "sortCheckboxChange", folderId: "f1", activated: true },
      {},
      sendResponse
    );
    expect(
      global.Annotations.removeDoNotSortAnnotation
    ).toHaveBeenCalledWith("f1");
    expect(
      global.Annotations.removeRecursiveAnnotation
    ).toHaveBeenCalledWith("f1");
  });

  test("deactivated: sets do-not-sort annotation", () => {
    const sendResponse = jest.fn();
    messageListener(
      { action: "sortCheckboxChange", folderId: "f2", activated: false },
      {},
      sendResponse
    );
    expect(global.Annotations.setDoNotSortAnnotation).toHaveBeenCalledWith(
      "f2"
    );
  });
});

describe("message handler — recursiveCheckboxChange", () => {
  test("activated: sets recursive annotation", () => {
    const sendResponse = jest.fn();
    messageListener(
      { action: "recursiveCheckboxChange", folderId: "f3", activated: true },
      {},
      sendResponse
    );
    expect(global.Annotations.setRecursiveAnnotation).toHaveBeenCalledWith(
      "f3"
    );
  });

  test("deactivated: removes recursive annotation", () => {
    const sendResponse = jest.fn();
    messageListener(
      { action: "recursiveCheckboxChange", folderId: "f4", activated: false },
      {},
      sendResponse
    );
    expect(
      global.Annotations.removeRecursiveAnnotation
    ).toHaveBeenCalledWith("f4");
  });
});

describe("message handler — queryRoot", () => {
  test("returns true for async response", () => {
    const sendResponse = jest.fn();
    const result = messageListener(
      { action: "queryRoot" },
      {},
      sendResponse
    );
    expect(result).toBe(true);
  });
});

describe("message handler — queryChildren", () => {
  test("returns true for async response", () => {
    const sendResponse = jest.fn();
    const result = messageListener(
      { action: "queryChildren", parentId: "p1" },
      {},
      sendResponse
    );
    expect(result).toBe(true);
  });
});
