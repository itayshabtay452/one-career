import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  getTextDirection,
  isSupportedLocale,
} from "./config";

describe("locale configuration", () => {
  it("uses English as the first product language", () => {
    expect(defaultLocale).toBe("en");
  });

  it("recognizes only configured locales", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("he")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
  });

  it("keeps Hebrew ready for RTL rendering", () => {
    expect(getTextDirection("en")).toBe("ltr");
    expect(getTextDirection("he")).toBe("rtl");
  });
});
