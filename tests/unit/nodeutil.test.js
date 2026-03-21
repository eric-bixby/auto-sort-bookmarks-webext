// Mock globals consumed by NodeUtil's methods (not at load time).
global.AsbUtil = { log: jest.fn() };
global.AsbPrefs = {
  getBookmarkOrder: jest.fn().mockReturnValue(2),
  getFolderOrder: jest.fn().mockReturnValue(1),
};

const NodeUtil = require("../../src/NodeUtil");

describe("NodeUtil.getNodeType", () => {
  test("node without url is a folder", () => {
    expect(NodeUtil.getNodeType({ id: "1" })).toBe("folder");
  });

  test('node with url "data:" is a separator', () => {
    expect(NodeUtil.getNodeType({ id: "1", url: "data:" })).toBe("separator");
  });

  test("node with a real url is a bookmark", () => {
    expect(NodeUtil.getNodeType({ id: "1", url: "https://example.com" })).toBe(
      "bookmark"
    );
  });
});

describe("NodeUtil.createItemFromNode — bookmark", () => {
  const node = {
    id: "bm1",
    index: 3,
    parentId: "folder1",
    title: "My Bookmark",
    url: "https://example.com/page",
    dateAdded: 1000,
    lastModified: 2000,
    lastVisited: 3000,
    accessCount: 5,
  };

  test("returns a BookmarkItem with all fields", () => {
    const item = NodeUtil.createItemFromNode(node);
    expect(item.type).toBe("bookmark");
    expect(item.id).toBe("bm1");
    expect(item.index).toBe(3);
    expect(item.oldIndex).toBe(3);
    expect(item.parentId).toBe("folder1");
    expect(item.title).toBe("My Bookmark");
    expect(item.url).toBe("https://example.com/page");
    expect(item.dateAdded).toBe(1000);
    expect(item.lastModified).toBe(2000);
    expect(item.lastVisited).toBe(3000);
    expect(item.accessCount).toBe(5);
    expect(item.corrupted).toBe(false);
  });

  test("uses AsbPrefs.getBookmarkOrder() for the order field", () => {
    global.AsbPrefs.getBookmarkOrder.mockReturnValue(2);
    const item = NodeUtil.createItemFromNode(node);
    expect(item.order).toBe(2);
  });

  test("defaults missing optional fields to 0", () => {
    const sparse = {
      id: "bm2",
      index: 0,
      parentId: "f1",
      title: "Title",
      url: "https://example.com",
      dateAdded: 0,
    };
    const item = NodeUtil.createItemFromNode(sparse);
    expect(item.lastModified).toBe(0);
    expect(item.lastVisited).toBe(0);
    expect(item.accessCount).toBe(0);
  });
});

describe("NodeUtil.createItemFromNode — corrupted bookmark", () => {
  test("marks item as corrupted and logs when title is null", () => {
    const node = {
      id: "bm3",
      index: 0,
      parentId: "f1",
      title: null,
      url: "https://example.com",
      dateAdded: 1000,
      lastModified: 2000,
    };
    const item = NodeUtil.createItemFromNode(node);
    expect(item.corrupted).toBe(true);
    expect(global.AsbUtil.log).toHaveBeenCalled();
  });
});

describe("NodeUtil.createItemFromNode — folder", () => {
  const node = {
    id: "fl1",
    index: 0,
    parentId: "root",
    title: "My Folder",
    dateAdded: 500,
    dateGroupModified: 999,
  };

  test("returns a FolderItem with folder fields", () => {
    const item = NodeUtil.createItemFromNode(node);
    expect(item.type).toBe("folder");
    expect(item.id).toBe("fl1");
    expect(item.title).toBe("My Folder");
    expect(item.dateAdded).toBe(500);
    expect(item.lastModified).toBe(999);
  });

  test("uses AsbPrefs.getFolderOrder() for the order field", () => {
    global.AsbPrefs.getFolderOrder.mockReturnValue(1);
    const item = NodeUtil.createItemFromNode(node);
    expect(item.order).toBe(1);
  });

  test("does not have url or corrupted fields", () => {
    const item = NodeUtil.createItemFromNode(node);
    expect(item.url).toBeUndefined();
    expect(item.corrupted).toBeUndefined();
  });
});

describe("NodeUtil.createItemFromNode — separator", () => {
  test("returns a SeparatorItem with only base fields", () => {
    const node = { id: "sep1", index: 2, parentId: "f1", url: "data:" };
    const item = NodeUtil.createItemFromNode(node);
    expect(item.type).toBe("separator");
    expect(item.id).toBe("sep1");
    expect(item.index).toBe(2);
    expect(item.title).toBeUndefined();
    expect(item.url).toBeUndefined();
  });
});
