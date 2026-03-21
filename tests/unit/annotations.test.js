const Annotations = require("../../src/Annotations");

beforeEach(() => {
  // Reset singleton state before each test.
  Annotations.init({});
});

describe("Annotations.init", () => {
  test("initialises from stored data", () => {
    Annotations.init({ donotsort: { "111": true }, recursive: { "222": true } });
    expect(Annotations.hasDoNotSortAnnotation("111")).toBe(true);
    expect(Annotations.hasRecursiveAnnotation("222")).toBe(true);
  });

  test("treats missing keys as false", () => {
    Annotations.init({});
    expect(Annotations.hasDoNotSortAnnotation("999")).toBe(false);
    expect(Annotations.hasRecursiveAnnotation("999")).toBe(false);
  });
});

describe("Annotations.hasDoNotSortAnnotation", () => {
  test("returns true when flag is set", () => {
    Annotations.setDoNotSortAnnotation("abc");
    expect(Annotations.hasDoNotSortAnnotation("abc")).toBe(true);
  });

  test("returns false for an unknown folder", () => {
    expect(Annotations.hasDoNotSortAnnotation("unknown")).toBe(false);
  });
});

describe("Annotations.hasRecursiveAnnotation", () => {
  test("returns true when flag is set", () => {
    Annotations.setRecursiveAnnotation("abc");
    expect(Annotations.hasRecursiveAnnotation("abc")).toBe(true);
  });

  test("returns false for an unknown folder", () => {
    expect(Annotations.hasRecursiveAnnotation("unknown")).toBe(false);
  });
});

describe("Annotations.isRecursivelyExcluded", () => {
  test("returns true when both donotsort and recursive flags are set", () => {
    Annotations.setDoNotSortAnnotation("folder1");
    Annotations.setRecursiveAnnotation("folder1");
    expect(Annotations.isRecursivelyExcluded("folder1")).toBe(true);
  });

  test("returns false when only donotsort is set", () => {
    Annotations.setDoNotSortAnnotation("folder2");
    expect(Annotations.isRecursivelyExcluded("folder2")).toBe(false);
  });

  test("returns false when only recursive is set", () => {
    Annotations.setRecursiveAnnotation("folder3");
    expect(Annotations.isRecursivelyExcluded("folder3")).toBe(false);
  });

  test("returns false when neither flag is set", () => {
    expect(Annotations.isRecursivelyExcluded("folder4")).toBe(false);
  });
});

describe("Annotations.setDoNotSortAnnotation", () => {
  test("sets the flag and persists to storage", () => {
    Annotations.setDoNotSortAnnotation("f1");
    expect(Annotations.hasDoNotSortAnnotation("f1")).toBe(true);
    expect(browser.storage.local.set).toHaveBeenCalled();
  });
});

describe("Annotations.removeDoNotSortAnnotation", () => {
  test("clears the flag and persists to storage", () => {
    Annotations.setDoNotSortAnnotation("f1");
    browser.storage.local.set.mockClear();
    Annotations.removeDoNotSortAnnotation("f1");
    expect(Annotations.hasDoNotSortAnnotation("f1")).toBe(false);
    expect(browser.storage.local.set).toHaveBeenCalled();
  });

  test("does nothing (no storage write) if flag was not set", () => {
    Annotations.removeDoNotSortAnnotation("nonexistent");
    expect(browser.storage.local.set).not.toHaveBeenCalled();
  });
});

describe("Annotations.setRecursiveAnnotation", () => {
  test("sets the recursive flag and persists", () => {
    Annotations.setRecursiveAnnotation("f2");
    expect(Annotations.hasRecursiveAnnotation("f2")).toBe(true);
    expect(browser.storage.local.set).toHaveBeenCalled();
  });
});

describe("Annotations.removeRecursiveAnnotation", () => {
  test("clears the recursive flag and persists", () => {
    Annotations.setRecursiveAnnotation("f2");
    browser.storage.local.set.mockClear();
    Annotations.removeRecursiveAnnotation("f2");
    expect(Annotations.hasRecursiveAnnotation("f2")).toBe(false);
    expect(browser.storage.local.set).toHaveBeenCalled();
  });
});

describe("Annotations.removeMissingFolders", () => {
  test("removes stale annotations for folders that no longer exist", () => {
    Annotations.init({
      donotsort: { "alive": true, "gone": true },
      recursive: { "gone": true },
    });
    Annotations.removeMissingFolders([{ id: "alive" }]);
    expect(Annotations.hasDoNotSortAnnotation("alive")).toBe(true);
    expect(Annotations.hasDoNotSortAnnotation("gone")).toBe(false);
    expect(Annotations.hasRecursiveAnnotation("gone")).toBe(false);
  });

  test("does nothing when all annotated folders still exist", () => {
    Annotations.init({ donotsort: { "f1": true } });
    Annotations.removeMissingFolders([{ id: "f1" }]);
    expect(Annotations.hasDoNotSortAnnotation("f1")).toBe(true);
  });

  test("handles empty folder list by removing all annotations", () => {
    Annotations.init({ donotsort: { "f1": true }, recursive: { "f1": true } });
    Annotations.removeMissingFolders([]);
    expect(Annotations.hasDoNotSortAnnotation("f1")).toBe(false);
    expect(Annotations.hasRecursiveAnnotation("f1")).toBe(false);
  });
});
