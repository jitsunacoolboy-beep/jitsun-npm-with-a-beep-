export interface Link {
  id: number;
  code: string;
  original_url: string;
  created_at: string; // ISO 8601
  expires_at: string | null; // ISO 8601 or null
  clicks: number;
}

export interface LinkWithStatus extends Link {
  is_expired: boolean;
  short_url: string;
}

export interface CreateLinkInput {
  url: string;
  alias?: string;
  expiresAt?: string | null;
}

export interface Click {
  id: number;
  link_id: number;
  timestamp: string; // ISO 8601
  referrer: string | null;
  user_agent: string | null;
  ip: string | null;
  browser: string | null;
  os: string | null;
}

export interface ClickRecordInput {
  linkId: number;
  timestamp?: string;
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  browser?: string | null;
  os?: string | null;
}

export interface DailyClickStat {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface ReferrerStat {
  referrer: string;
  count: number;
  percentage: number;
}

export interface BrowserStat {
  browser: string;
  count: number;
  percentage: number;
}

export interface OSStat {
  os: string;
  count: number;
  percentage: number;
}

export interface LinkAnalytics {
  link: LinkWithStatus;
  totalClicks: number;
  clicksPerDay: DailyClickStat[];
  topReferrers: ReferrerStat[];
  topBrowsers: BrowserStat[];
  topOS: OSStat[];
  recentClicks: Array<{
    id: number;
    timestamp: string;
    referrer: string;
    browser: string;
    os: string;
    userAgent: string;
  }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
