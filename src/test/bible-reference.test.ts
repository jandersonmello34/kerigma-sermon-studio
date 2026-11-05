import { describe, expect, it } from "vitest";
import { formatReference } from "@/lib/bible";

describe("formatReference", () => {
  it("formats a verse range in order even when picked backwards", () => {
    expect(formatReference(55, 2, 14, 11)).toBe("Tito 2:11-14");
  });
  it("formats a single verse", () => {
    expect(formatReference(42, 3, 16, 16)).toBe("João 3:16");
  });
});
