const AsbUtil = require("../../src/AsbUtil");

describe("AsbUtil.reverseBaseUrl", () => {
  test("returns empty string for falsy input", () => {
    expect(AsbUtil.reverseBaseUrl("")).toBe("");
    expect(AsbUtil.reverseBaseUrl(null)).toBe("");
    expect(AsbUtil.reverseBaseUrl(undefined)).toBe("");
  });

  test("reverses domain segments of a simple URL", () => {
    expect(AsbUtil.reverseBaseUrl("https://www.example.com")).toBe(
      "com.example.www"
    );
  });

  test("reverses domain and preserves path", () => {
    expect(AsbUtil.reverseBaseUrl("https://www.example.co.uk/path/to/page")).toBe(
      "uk.co.example.www/path/to/page"
    );
  });

  test("strips the protocol before reversing", () => {
    expect(AsbUtil.reverseBaseUrl("http://example.org")).toBe("org.example");
    expect(AsbUtil.reverseBaseUrl("ftp://files.example.com")).toBe(
      "com.example.files"
    );
  });

  test("handles URLs with no path", () => {
    expect(AsbUtil.reverseBaseUrl("https://example.com")).toBe("com.example");
  });

  test("handles single-segment domain", () => {
    expect(AsbUtil.reverseBaseUrl("https://localhost/app")).toBe(
      "localhost/app"
    );
  });
});

describe("AsbUtil.log", () => {
  test("calls console.log with the provided value", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    AsbUtil.log("test message");
    expect(spy).toHaveBeenCalledWith("test message");
    spy.mockRestore();
  });

  test("passes objects through to console.log", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    const obj = { key: "value" };
    AsbUtil.log(obj);
    expect(spy).toHaveBeenCalledWith(obj);
    spy.mockRestore();
  });
});
