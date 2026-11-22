export interface ParsedUserAgent {
  browser: string;
  os: string;
}

export function parseUserAgent(uaString: string | null | undefined): ParsedUserAgent {
  if (!uaString) {
    return { browser: "Unknown", os: "Unknown" };
  }

  const ua = uaString.toLowerCase();

  // OS detection
  let os = "Other";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
    os = "iOS";
  } else if (ua.includes("android")) {
    os = "Android";
  } else if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "macOS";
  } else if (ua.includes("windows")) {
    os = "Windows";
  } else if (ua.includes("linux")) {
    os = "Linux";
  } else if (ua.includes("cros")) {
    os = "ChromeOS";
  }

  // Browser detection
  let browser = "Other";
  if (ua.includes("edg/") || ua.includes("edge/")) {
    browser = "Edge";
  } else if (ua.includes("opr/") || ua.includes("opera/")) {
    browser = "Opera";
  } else if (ua.includes("chrome") && !ua.includes("chromium") && !ua.includes("edg")) {
    browser = "Chrome";
  } else if (
    ua.includes("safari") ||
    ((os === "iOS" || os === "macOS") && ua.includes("applewebkit"))
  ) {
    browser = "Safari";
  } else if (ua.includes("firefox") || ua.includes("fxios")) {
    browser = "Firefox";
  } else if (ua.includes("curl") || ua.includes("postman") || ua.includes("wget")) {
    browser = "API Client";
  } else if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
    browser = "Bot/Crawler";
  }

  return { browser, os };
}
