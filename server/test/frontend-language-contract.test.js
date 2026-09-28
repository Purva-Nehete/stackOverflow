import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

const readFrontendFile = async (relativePath) => {
  return readFile(new URL(`../../stack/${relativePath}`, import.meta.url), "utf8");
};

describe("frontend language contracts", () => {
  it("initializes and persists only supported locales", async () => {
    const config = await readFrontendFile("src/lib/i18n/config.ts");
    const context = await readFrontendFile("src/lib/i18n/I18nContext.tsx");

    for (const locale of ["en", "es", "hi", "pt", "zh", "fr"]) {
      assert.match(config, new RegExp(`\\"${locale}\\"`));
    }

    assert.match(config, /preferredLanguage/);
    assert.match(context, /localStorage\.setItem\("locale", locale\)/);
    assert.match(context, /translations\[defaultLocale\]\[key\]/);
  });

  it("contains translated settings and OTP states for every supported locale", async () => {
    const translations = await readFrontendFile("src/lib/i18n/translations.ts");
    const settings = await readFrontendFile("src/pages/settings/index.tsx");

    for (const locale of ["en", "es", "hi", "pt", "zh", "fr"]) {
      assert.match(translations, new RegExp(`^  ${locale}:`, "m"));
    }

    for (const key of [
      "settings.title",
      "settings.sendOtp",
      "settings.enterOtp",
      "settings.verify",
      "settings.resend",
      "settings.channelEmail",
      "settings.channelMobile",
    ]) {
      assert.match(translations, new RegExp(`\\"${key}\\"`));
    }

    assert.match(settings, /supportedLocales\.map/);
    assert.match(settings, /request-otp/);
    assert.match(settings, /patch\("\/user\/language"/);
    assert.match(settings, /setLocale\(selectedLocale\)/);
    assert.match(settings, /countdown/);
  });
});
