global.AsbUtil = { log: jest.fn() };
global.AsbPrefs = { removeFolder: jest.fn() };
global.NodeUtil = { getNodeType: jest.fn() };

const { createChangeHandler } = require("../../src/ChangeHandler");

let sorter;
let handler;

beforeEach(() => {
  sorter = { sortIfAuto: jest.fn() };
  handler = createChangeHandler(sorter);
});

describe("createChangeListeners", () => {
  test("registers all bookmark and history listeners", () => {
    handler.createChangeListeners();

    expect(browser.bookmarks.onChanged.addListener).toHaveBeenCalledTimes(1);
    expect(browser.bookmarks.onCreated.addListener).toHaveBeenCalledTimes(1);
    expect(browser.bookmarks.onMoved.addListener).toHaveBeenCalledTimes(1);
    expect(browser.bookmarks.onRemoved.addListener).toHaveBeenCalledTimes(1);
    expect(browser.history.onVisited.addListener).toHaveBeenCalledTimes(1);
  });
});

describe("removeChangeListeners", () => {
  test("removes all bookmark and history listeners", () => {
    handler.removeChangeListeners();

    expect(browser.bookmarks.onChanged.removeListener).toHaveBeenCalledTimes(1);
    expect(browser.bookmarks.onCreated.removeListener).toHaveBeenCalledTimes(1);
    expect(browser.bookmarks.onMoved.removeListener).toHaveBeenCalledTimes(1);
    expect(browser.bookmarks.onRemoved.removeListener).toHaveBeenCalledTimes(1);
    expect(browser.history.onVisited.removeListener).toHaveBeenCalledTimes(1);
  });

  test("removes the same listener functions that were added", () => {
    handler.createChangeListeners();
    handler.removeChangeListeners();

    const added = browser.bookmarks.onChanged.addListener.mock.calls[0][0];
    const removed = browser.bookmarks.onChanged.removeListener.mock.calls[0][0];
    expect(removed).toBe(added);
  });
});

describe("handleChanged", () => {
  test("calls sortIfAuto on bookmark change", () => {
    handler.createChangeListeners();
    const handleChanged = browser.bookmarks.onChanged.addListener.mock.calls[0][0];

    handleChanged("bookmark-1");

    expect(sorter.sortIfAuto).toHaveBeenCalledTimes(1);
  });
});

describe("handleCreated", () => {
  test("calls sortIfAuto on bookmark creation", () => {
    handler.createChangeListeners();
    const handleCreated = browser.bookmarks.onCreated.addListener.mock.calls[0][0];

    handleCreated("bookmark-2");

    expect(sorter.sortIfAuto).toHaveBeenCalledTimes(1);
  });
});

describe("handleMoved", () => {
  test("calls sortIfAuto on bookmark move", () => {
    handler.createChangeListeners();
    const handleMoved = browser.bookmarks.onMoved.addListener.mock.calls[0][0];

    handleMoved("bookmark-3");

    expect(sorter.sortIfAuto).toHaveBeenCalledTimes(1);
  });
});

describe("handleRemoved", () => {
  test("calls sortIfAuto when a separator is removed", () => {
    global.NodeUtil.getNodeType.mockReturnValue("separator");
    handler.createChangeListeners();
    const handleRemoved = browser.bookmarks.onRemoved.addListener.mock.calls[0][0];

    handleRemoved("sep-1", { node: { url: "data:" } });

    expect(sorter.sortIfAuto).toHaveBeenCalledTimes(1);
    expect(global.AsbPrefs.removeFolder).not.toHaveBeenCalled();
  });

  test("calls removeFolder when a folder is removed", () => {
    global.NodeUtil.getNodeType.mockReturnValue("folder");
    handler.createChangeListeners();
    const handleRemoved = browser.bookmarks.onRemoved.addListener.mock.calls[0][0];

    handleRemoved("folder-1", { node: {} });

    expect(sorter.sortIfAuto).not.toHaveBeenCalled();
    expect(global.AsbPrefs.removeFolder).toHaveBeenCalledWith("folder-1");
  });

  test("does not sort or remove when a bookmark is removed", () => {
    global.NodeUtil.getNodeType.mockReturnValue("bookmark");
    handler.createChangeListeners();
    const handleRemoved = browser.bookmarks.onRemoved.addListener.mock.calls[0][0];

    handleRemoved("bookmark-4", { node: { url: "https://example.com" } });

    expect(sorter.sortIfAuto).not.toHaveBeenCalled();
    expect(global.AsbPrefs.removeFolder).not.toHaveBeenCalled();
  });
});

describe("handleVisited", () => {
  test("calls sortIfAuto on history visit", () => {
    handler.createChangeListeners();
    const handleVisited = browser.history.onVisited.addListener.mock.calls[0][0];

    handleVisited({ url: "https://example.com" });

    expect(sorter.sortIfAuto).toHaveBeenCalledTimes(1);
  });

  test("ignores moz-extension URLs", () => {
    handler.createChangeListeners();
    const handleVisited = browser.history.onVisited.addListener.mock.calls[0][0];

    handleVisited({ url: "moz-extension://some-id/page.html" });

    expect(sorter.sortIfAuto).not.toHaveBeenCalled();
  });
});
