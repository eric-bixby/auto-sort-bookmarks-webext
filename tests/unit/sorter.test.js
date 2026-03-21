// Mock all globals consumed by createSorter and createChangeHandler.
global.AsbUtil = { log: jest.fn() };
global.AsbPrefs = {
  getPref: jest.fn(),
  getRootId: jest.fn().mockReturnValue("root________"),
};
global.Annotations = {
  isRecursivelyExcluded: jest.fn().mockReturnValue(false),
  removeMissingFolders: jest.fn(),
};
global.FolderUtil = {
  getDescendantFolders: jest.fn().mockResolvedValue([]),
  canBeSorted: jest.fn().mockReturnValue(false),
  getChildrenWithHistory: jest.fn().mockResolvedValue([[]]),
  saveOrder: jest.fn().mockResolvedValue(undefined),
};
global.createChangeHandler = jest.fn(() => ({
  createChangeListeners: jest.fn(),
  removeChangeListeners: jest.fn(),
}));
global.createCompare = jest.fn().mockReturnValue(() => 0);

const { createSorter } = require("../../src/Sorter");

beforeEach(() => {
  jest.useFakeTimers();
  global.AsbPrefs.getPref.mockImplementation((key) => {
    if (key === "auto_sort") return false;
    if (key === "delay") return 3;
    return undefined;
  });
  browser.bookmarks.getChildren.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Sorter.sortIfAuto", () => {
  test("does not schedule a sort when auto_sort is false", () => {
    global.AsbPrefs.getPref.mockImplementation((key) =>
      key === "auto_sort" ? false : 3
    );
    const sorter = createSorter();
    sorter.sortIfAuto();
    jest.runAllTimers();
    expect(browser.bookmarks.getChildren).not.toHaveBeenCalled();
  });

  test("schedules a sort when auto_sort is true", async () => {
    global.AsbPrefs.getPref.mockImplementation((key) =>
      key === "auto_sort" ? true : 3
    );
    const sorter = createSorter();
    sorter.sortIfAuto();
    await jest.runAllTimersAsync();
    expect(browser.bookmarks.getChildren).toHaveBeenCalledWith("root________");
  });
});

describe("Sorter.sortNow", () => {
  test("schedules a sort regardless of auto_sort setting", async () => {
    global.AsbPrefs.getPref.mockImplementation((key) =>
      key === "auto_sort" ? false : 3
    );
    const sorter = createSorter();
    sorter.sortNow();
    await jest.runAllTimersAsync();
    expect(browser.bookmarks.getChildren).toHaveBeenCalledWith("root________");
  });
});

describe("Sorter debounce", () => {
  test("coalesces rapid calls into a single sort", async () => {
    global.AsbPrefs.getPref.mockImplementation((key) =>
      key === "auto_sort" ? true : 3
    );
    const sorter = createSorter();
    sorter.sortIfAuto();
    sorter.sortIfAuto();
    sorter.sortIfAuto();
    await jest.runAllTimersAsync();
    // getChildren should only be called once despite three sortIfAuto calls.
    expect(browser.bookmarks.getChildren).toHaveBeenCalledTimes(1);
  });
});

describe("Sorter listener management", () => {
  test("removes listeners before sorting and re-adds them after", async () => {
    global.AsbPrefs.getPref.mockImplementation((key) =>
      key === "auto_sort" ? true : 3
    );
    const sorter = createSorter();
    const [handler] = global.createChangeHandler.mock.results;
    const { removeChangeListeners, createChangeListeners } = handler.value;

    sorter.sortNow();
    // Advance only the debounce delay so the sort runs but the settle timer hasn't fired yet.
    await jest.advanceTimersByTimeAsync(3000);

    expect(removeChangeListeners).toHaveBeenCalled();
    // Re-attach fires after a separate 3-second settle delay.
    expect(createChangeListeners).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(3000);
    expect(createChangeListeners).toHaveBeenCalled();
  });
});

describe("Sorter.setCriteria", () => {
  test("accepts a criteria object without throwing", () => {
    const sorter = createSorter();
    expect(() =>
      sorter.setCriteria({
        sortBy: "title",
        inverse: false,
        thenSortBy: "none",
        thenInverse: false,
        folderSortBy: "title",
        folderInverse: false,
        caseInsensitive: false,
      })
    ).not.toThrow();
  });
});
