/**
 * Global browser API mock injected into every test file.
 * Each jest.fn() is cleared between tests (clearMocks: true in jest.config.js).
 */
global.browser = {
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
    },
  },
  bookmarks: {
    getChildren: jest.fn().mockResolvedValue([]),
    getSubTree: jest.fn().mockResolvedValue([]),
    move: jest.fn().mockResolvedValue(undefined),
    onChanged: { addListener: jest.fn(), removeListener: jest.fn() },
    onCreated: { addListener: jest.fn(), removeListener: jest.fn() },
    onMoved: { addListener: jest.fn(), removeListener: jest.fn() },
    onRemoved: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  history: {
    getVisits: jest.fn().mockResolvedValue([]),
    onVisited: { addListener: jest.fn(), removeListener: jest.fn() },
  },
  runtime: {
    onMessage: { addListener: jest.fn(), removeListener: jest.fn() },
    getURL: jest.fn((path) => `moz-extension://test/${path}`),
    getManifest: jest.fn(() => ({ version: "3.4.6" })),
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
  tabs: {
    query: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    sendMessage: jest.fn().mockResolvedValue(undefined),
  },
  windows: {
    update: jest.fn().mockResolvedValue({}),
  },
  i18n: {
    getMessage: jest.fn((key) => key),
  },
};
