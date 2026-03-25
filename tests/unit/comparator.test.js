// AsbUtil is required by compareByField for "revurl" and "hostname" fields.
global.AsbUtil = require("../../src/AsbUtil");

const { createCompare } = require("../../src/Comparator");

/** Helper: create a minimal BookmarkItem */
function bookmark(overrides = {}) {
  return {
    type: "bookmark",
    order: 2,
    corrupted: false,
    title: "Bookmark",
    url: "https://example.com",
    dateAdded: 1000,
    lastModified: 2000,
    lastVisited: 0,
    accessCount: 0,
    ...overrides,
  };
}

/** Helper: create a minimal FolderItem */
function folder(overrides = {}) {
  return {
    type: "folder",
    order: 1,
    title: "Folder",
    dateAdded: 1000,
    lastModified: 2000,
    ...overrides,
  };
}

const baseCriteria = {
  sortBy: "title",
  inverse: false,
  thenSortBy: "none",
  thenInverse: false,
  folderSortBy: "title",
  folderInverse: false,
  caseInsensitive: false,
};

describe("createCompare — corrupted items", () => {
  const compare = createCompare(baseCriteria);

  test("corrupted item sorts after normal item", () => {
    const normal = bookmark({ title: "Z" });
    const corrupt = bookmark({ corrupted: true, title: "A" });
    expect(compare(corrupt, normal)).toBeGreaterThan(0);
    expect(compare(normal, corrupt)).toBeLessThan(0);
  });

  test("two corrupted items are equal", () => {
    const a = bookmark({ corrupted: true });
    const b = bookmark({ corrupted: true });
    expect(compare(a, b)).toBe(0);
  });
});

describe("createCompare — folders vs bookmarks", () => {
  test("folder (order 1) sorts before bookmark (order 2)", () => {
    const compare = createCompare(baseCriteria);
    const f = folder({ order: 1, title: "Z" });
    const b = bookmark({ order: 2, title: "A" });
    expect(compare(f, b)).toBeLessThan(0);
    expect(compare(b, f)).toBeGreaterThan(0);
  });

  test("bookmark (order 1) sorts before folder (order 2) when bookmarks-first", () => {
    const compare = createCompare(baseCriteria);
    const f = folder({ order: 2, title: "A" });
    const b = bookmark({ order: 1, title: "Z" });
    expect(compare(b, f)).toBeLessThan(0);
    expect(compare(f, b)).toBeGreaterThan(0);
  });
});

describe("createCompare — sort by title", () => {
  const compare = createCompare(baseCriteria);

  test("sorts bookmarks alphabetically by title ascending", () => {
    const a = bookmark({ title: "Apple" });
    const b = bookmark({ title: "Banana" });
    expect(compare(a, b)).toBeLessThan(0);
    expect(compare(b, a)).toBeGreaterThan(0);
  });

  test("equal titles return 0", () => {
    const a = bookmark({ title: "Same" });
    const b = bookmark({ title: "Same" });
    expect(compare(a, b)).toBe(0);
  });

  test("inverse: sorts descending", () => {
    const compare = createCompare({ ...baseCriteria, inverse: true });
    const a = bookmark({ title: "Apple" });
    const b = bookmark({ title: "Banana" });
    expect(compare(a, b)).toBeGreaterThan(0);
    expect(compare(b, a)).toBeLessThan(0);
  });

  test("case sensitive: uppercase before lowercase", () => {
    const compare = createCompare({ ...baseCriteria, caseInsensitive: false });
    const upper = bookmark({ title: "APPLE" });
    const lower = bookmark({ title: "apple" });
    // caseFirst: "upper" — uppercase sorts first
    expect(compare(upper, lower)).toBeLessThan(0);
  });

  test("case insensitive: treats same", () => {
    const compare = createCompare({ ...baseCriteria, caseInsensitive: true });
    const upper = bookmark({ title: "APPLE" });
    const lower = bookmark({ title: "apple" });
    expect(compare(upper, lower)).toBe(0);
  });
});

describe("createCompare — sort by url", () => {
  test("sorts bookmarks by URL alphabetically", () => {
    const compare = createCompare({ ...baseCriteria, sortBy: "url" });
    const a = bookmark({ url: "https://aardvark.com" });
    const b = bookmark({ url: "https://zebra.com" });
    expect(compare(a, b)).toBeLessThan(0);
  });
});

describe("createCompare — sort by revurl", () => {
  test("sorts by reversed domain", () => {
    const compare = createCompare({ ...baseCriteria, sortBy: "revurl" });
    // com.apple vs com.zebra — apple < zebra
    const a = bookmark({ url: "https://apple.com/page" });
    const b = bookmark({ url: "https://zebra.com/page" });
    expect(compare(a, b)).toBeLessThan(0);
  });
});

describe("createCompare — sort by hostname", () => {
  test("sorts by hostname", () => {
    const compare = createCompare({ ...baseCriteria, sortBy: "hostname" });
    const a = bookmark({ url: "https://alpha.example.com" });
    const b = bookmark({ url: "https://zeta.example.com" });
    expect(compare(a, b)).toBeLessThan(0);
  });

  test("handles malformed URLs gracefully", () => {
    const compare = createCompare({ ...baseCriteria, sortBy: "hostname" });
    const a = bookmark({ url: "not-a-valid-url" });
    const b = bookmark({ url: "https://example.com" });
    expect(() => compare(a, b)).not.toThrow();
  });

  test("handles empty URL gracefully", () => {
    const compare = createCompare({ ...baseCriteria, sortBy: "hostname" });
    const a = bookmark({ url: "" });
    const b = bookmark({ url: "https://example.com" });
    expect(() => compare(a, b)).not.toThrow();
  });
});

describe("createCompare — sort by numeric fields", () => {
  test("sorts by dateAdded ascending", () => {
    const compare = createCompare({ ...baseCriteria, sortBy: "dateAdded" });
    const older = bookmark({ dateAdded: 1000 });
    const newer = bookmark({ dateAdded: 2000 });
    expect(compare(older, newer)).toBeLessThan(0);
  });

  test("sorts by accessCount descending with inverse", () => {
    const compare = createCompare({
      ...baseCriteria,
      sortBy: "accessCount",
      inverse: true,
    });
    const less = bookmark({ accessCount: 1 });
    const more = bookmark({ accessCount: 10 });
    expect(compare(more, less)).toBeLessThan(0);
  });
});

describe("createCompare — secondary sort (thenSortBy)", () => {
  test("uses secondary criteria when primary is equal", () => {
    const compare = createCompare({
      ...baseCriteria,
      sortBy: "title",
      thenSortBy: "url",
    });
    const a = bookmark({ title: "Same", url: "https://aaa.com" });
    const b = bookmark({ title: "Same", url: "https://zzz.com" });
    expect(compare(a, b)).toBeLessThan(0);
  });

  test("does not use secondary criteria when primary differs", () => {
    const compare = createCompare({
      ...baseCriteria,
      sortBy: "title",
      thenSortBy: "url",
    });
    const a = bookmark({ title: "Alpha", url: "https://zzz.com" });
    const b = bookmark({ title: "Beta", url: "https://aaa.com" });
    expect(compare(a, b)).toBeLessThan(0); // primary wins
  });
});

describe("createCompare — folder sort", () => {
  test("sorts folders by title", () => {
    const compare = createCompare({ ...baseCriteria, folderSortBy: "title" });
    const a = folder({ title: "Alpha" });
    const b = folder({ title: "Beta" });
    expect(compare(a, b)).toBeLessThan(0);
  });

  test("folderSortBy 'none' preserves existing folder order", () => {
    const compare = createCompare({ ...baseCriteria, folderSortBy: "none" });
    const a = folder({ title: "Zebra" });
    const b = folder({ title: "Apple" });
    expect(compare(a, b)).toBe(0);
  });

  test("folder inverse: sorts descending", () => {
    const compare = createCompare({
      ...baseCriteria,
      folderSortBy: "title",
      folderInverse: true,
    });
    const a = folder({ title: "Alpha" });
    const b = folder({ title: "Beta" });
    expect(compare(a, b)).toBeGreaterThan(0);
  });
});
