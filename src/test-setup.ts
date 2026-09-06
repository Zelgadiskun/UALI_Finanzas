import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// @testing-library/react only auto-registers this when `afterEach` is a
// true global (vitest's `test.globals: true`) — this project keeps explicit
// `import { ... } from "vitest"` in test files instead, so it needs wiring
// by hand or DOM from one test leaks into the next.
afterEach(cleanup);
