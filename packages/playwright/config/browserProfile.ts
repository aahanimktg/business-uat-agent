import { devices, type BrowserContextOptions, type LaunchOptions } from "@playwright/test";

const desktopChrome = devices["Desktop Chrome"];
const desktopChromeScreen = { width: 1920, height: 1080 };

export const chromiumLaunchOptions: LaunchOptions = {
  headless: false,
  slowMo: 300,
  args: [
    "--start-maximized",
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-infobars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-popup-blocking",
    "--enable-javascript",
    "--lang=en-IN",
    "--window-size=1920,1080",
  ],
};

export const chromiumContextOptions: BrowserContextOptions = {
  userAgent: desktopChrome.userAgent,
  viewport: desktopChrome.viewport,
  screen: desktopChromeScreen,
  deviceScaleFactor: desktopChrome.deviceScaleFactor,
  isMobile: desktopChrome.isMobile,
  hasTouch: desktopChrome.hasTouch,
  locale: "en-IN",
  timezoneId: "Asia/Kolkata",
  geolocation: {
    latitude: 19.076,
    longitude: 72.8777,
  },
  permissions: [],
  ignoreHTTPSErrors: true,
  colorScheme: "light",
};

export function createMcpBrowserConfig(outputDir: string) {
  return {
    browser: {
      browserName: "chromium",
      isolated: true,
      launchOptions: chromiumLaunchOptions,
      contextOptions: chromiumContextOptions,
      outputDir,
    },
  };
}
