import { describe, expect, it } from "vitest";
import {
  ALLOWED_LICENSES,
  KNOWN_LICENSES,
  isAllowedLicense,
  isImportable,
  isVisuddhimaggaSlug,
  licenseFor,
} from "../licenses";

describe("license policy (ТЗ §4, §15.8)", () => {
  it("accepts Public Domain and CC0", () => {
    expect(isAllowedLicense(KNOWN_LICENSES.PUBLIC_DOMAIN)).toBe(true);
    expect(isAllowedLicense(KNOWN_LICENSES.CC0)).toBe(true);
  });

  it("rejects missing or unknown licenses", () => {
    expect(isAllowedLicense(undefined)).toBe(false);
    expect(isAllowedLicense("")).toBe(false);
    expect(isAllowedLicense("All Rights Reserved")).toBe(false);
    expect(isAllowedLicense(null)).toBe(false);
  });

  it("licenseFor returns consistent metadata per edition", () => {
    expect(licenseFor("bilara", "sujato").license).toBe(KNOWN_LICENSES.CC0);
    expect(licenseFor("manual", "muller-1881").license).toBe(
      KNOWN_LICENSES.PUBLIC_DOMAIN
    );
    expect(licenseFor("manual", "root").license).toBe(
      KNOWN_LICENSES.PUBLIC_DOMAIN
    );
  });

  it("isImportable respects allow-list", () => {
    expect(isImportable(KNOWN_LICENSES.CC0, "canonical")).toBe(true);
    expect(isImportable("Unknown", "canonical")).toBe(false);
  });

  it("isVisuddhimaggaSlug detects both slug variants", () => {
    expect(isVisuddhimaggaSlug("visuddhimagga")).toBe(true);
    expect(isVisuddhimaggaSlug("vism")).toBe(true);
    expect(isVisuddhimaggaSlug("dhammapada")).toBe(false);
  });

  it("the allow-list contains exactly the three vetted licenses", () => {
    expect([...ALLOWED_LICENSES].sort()).toEqual(
      [
        KNOWN_LICENSES.PUBLIC_DOMAIN,
        KNOWN_LICENSES.CC0,
        KNOWN_LICENSES.CC_BY_NC_ND,
      ].sort()
    );
  });
});
