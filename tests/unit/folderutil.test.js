// Mock globals consumed by FolderUtil's methods.
global.AsbPrefs = {
  getRootId: jest.fn().mockReturnValue("root________"),
};
global.Annotations = {
  hasDoNotSortAnnotation: jest.fn().mockReturnValue(false),
  hasRecursiveAnnotation: jest.fn().mockReturnValue(false),
  isRecursivelyExcluded: jest.fn().mockReturnValue(false),
};
global.NodeUtil = {
  getNodeType: jest.fn(),
  createItemFromNode: jest.fn(),
};

const FolderUtil = require("../../src/FolderUtil");

beforeEach(() => {
  global.AsbPrefs.getRootId.mockReturnValue("root________");
  global.Annotations.hasDoNotSortAnnotation.mockReturnValue(false);
  global.Annotations.isRecursivelyExcluded.mockReturnValue(false);
});

describe("FolderUtil.canBeSorted", () => {
  test("returns true for a normal folder", () => {
    const folder = { id: "abc" };
    expect(FolderUtil.canBeSorted(folder)).toBe(true);
  });

  test("returns false when folder has do-not-sort annotation", () => {
    global.Annotations.hasDoNotSortAnnotation.mockReturnValue(true);
    expect(FolderUtil.canBeSorted({ id: "abc" })).toBe(false);
  });

  test("returns false when folder is recursively excluded", () => {
    global.Annotations.isRecursivelyExcluded.mockReturnValue(true);
    expect(FolderUtil.canBeSorted({ id: "abc" })).toBe(false);
  });

  test("returns false for the bookmark tree root", () => {
    expect(FolderUtil.canBeSorted({ id: "root________" })).toBe(false);
  });
});

describe("FolderUtil.getChildrenFolders", () => {
  test("returns empty array when getChildren returns null", async () => {
    browser.bookmarks.getChildren.mockResolvedValue(null);
    global.NodeUtil.getNodeType.mockReturnValue("folder");
    const result = await FolderUtil.getChildrenFolders("parentId");
    expect(result).toEqual([]);
  });

  test("filters out non-folder children", async () => {
    browser.bookmarks.getChildren.mockResolvedValue([
      { id: "bm1", url: "https://example.com", title: "Bookmark", parentId: "p" },
      { id: "fl1", title: "Folder", parentId: "p" },
    ]);
    global.NodeUtil.getNodeType.mockImplementation((node) =>
      node.url ? "bookmark" : "folder"
    );
    const result = await FolderUtil.getChildrenFolders("p");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("fl1");
  });

  test("maps folder nodes to FolderDescriptor objects", async () => {
    browser.bookmarks.getChildren.mockResolvedValue([
      { id: "fl1", title: "My Folder", parentId: "p" },
    ]);
    global.NodeUtil.getNodeType.mockReturnValue("folder");
    global.Annotations.hasDoNotSortAnnotation.mockReturnValue(true);
    global.Annotations.hasRecursiveAnnotation.mockReturnValue(false);

    const result = await FolderUtil.getChildrenFolders("p");
    expect(result[0]).toMatchObject({
      id: "fl1",
      title: "My Folder",
      parentId: "p",
      excluded: true,
      recursivelyExcluded: false,
    });
  });
});

describe("FolderUtil.getChildrenWithHistory", () => {
  beforeEach(() => {
    global.NodeUtil.getNodeType.mockImplementation((node) => {
      if (!node.url) return "folder";
      if (node.url === "data:") return "separator";
      return "bookmark";
    });
    global.NodeUtil.createItemFromNode.mockImplementation((node) => ({
      type: global.NodeUtil.getNodeType(node),
      id: node.id,
      index: node.index || 0,
      oldIndex: node.index || 0,
    }));
  });

  test("returns one group when there are no separators", async () => {
    browser.bookmarks.getChildren.mockResolvedValue([
      { id: "bm1", url: "https://a.com", index: 0 },
      { id: "bm2", url: "https://b.com", index: 1 },
    ]);
    browser.history.getVisits.mockResolvedValue([]);

    const groups = await FolderUtil.getChildrenWithHistory("f1");
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  test("splits children into groups at separator boundaries", async () => {
    browser.bookmarks.getChildren.mockResolvedValue([
      { id: "bm1", url: "https://a.com", index: 0 },
      { id: "sep", url: "data:", index: 1 },
      { id: "bm2", url: "https://b.com", index: 2 },
    ]);
    browser.history.getVisits.mockResolvedValue([]);

    const groups = await FolderUtil.getChildrenWithHistory("f1");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveLength(1);
    expect(groups[1]).toHaveLength(1);
    expect(groups[0][0].id).toBe("bm1");
    expect(groups[1][0].id).toBe("bm2");
  });

  test("enriches bookmarks with visit history", async () => {
    browser.bookmarks.getChildren.mockResolvedValue([
      { id: "bm1", url: "https://a.com", index: 0 },
    ]);
    browser.history.getVisits.mockResolvedValue([
      { visitTime: 9999 },
      { visitTime: 8888 },
    ]);

    // createItemFromNode reads node.accessCount and node.lastVisited
    global.NodeUtil.createItemFromNode.mockImplementation((node) => ({
      type: "bookmark",
      id: node.id,
      index: node.index,
      oldIndex: node.index,
      accessCount: node.accessCount || 0,
      lastVisited: node.lastVisited || 0,
    }));

    const groups = await FolderUtil.getChildrenWithHistory("f1");
    expect(groups[0][0].accessCount).toBe(2);
    expect(groups[0][0].lastVisited).toBe(9999);
  });

  test("returns [[]] when getChildren returns null", async () => {
    browser.bookmarks.getChildren.mockResolvedValue(null);
    const groups = await FolderUtil.getChildrenWithHistory("f1");
    expect(groups).toEqual([[]]);
  });
});

describe("FolderUtil.saveOrder", () => {
  test("moves items whose index changed", async () => {
    const groups = [[
      { id: "bm1", index: 1, oldIndex: 0 },
      { id: "bm2", index: 0, oldIndex: 1 },
    ]];
    await FolderUtil.saveOrder(groups);
    expect(browser.bookmarks.move).toHaveBeenCalledTimes(2);
    expect(browser.bookmarks.move).toHaveBeenCalledWith("bm1", { index: 1 });
    expect(browser.bookmarks.move).toHaveBeenCalledWith("bm2", { index: 0 });
  });

  test("skips items whose index did not change", async () => {
    const groups = [[
      { id: "bm1", index: 0, oldIndex: 0 },
      { id: "bm2", index: 1, oldIndex: 1 },
    ]];
    await FolderUtil.saveOrder(groups);
    expect(browser.bookmarks.move).not.toHaveBeenCalled();
  });

  test("moves all items across multiple groups when any item changed", async () => {
    // saveOrder moves all items (not just the changed ones) once it determines
    // that at least one item has moved.
    const groups = [
      [{ id: "bm1", index: 1, oldIndex: 0 }], // changed
      [{ id: "bm2", index: 3, oldIndex: 2 }], // also changed
    ];
    await FolderUtil.saveOrder(groups);
    expect(browser.bookmarks.move).toHaveBeenCalledTimes(2);
    expect(browser.bookmarks.move).toHaveBeenCalledWith("bm1", { index: 1 });
    expect(browser.bookmarks.move).toHaveBeenCalledWith("bm2", { index: 3 });
  });
});
