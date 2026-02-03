export enum LinkHealthStatus {
  UNKNOWN = "unknown",
  HEALTHY = "healthy",
  WARNING = "warning",
  DEAD = "dead",
}

export enum LinkStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
}

export enum LinkCreatedType {
  APP = "app",
  API = "api",
  EXTENSION = "extension",
  BROWSER = "browser",
}

export enum EphemeralDuration {
  HOURS_1 = "1h",
  HOURS_6 = "6h",
  HOURS_12 = "12h",
  HOURS_24 = "24h",
  HOURS_48 = "48h",
}

export enum SafetyStatus {
  UNKNOWN = "unknown",
  SAFE = "safe",
  UNSAFE = "unsafe",
  MALWARE = "malware",
  SOCIAL_ENGINEERING = "social_engineering",
  UNWANTED_SOFTWARE = "unwanted_software",
  POTENTIALLY_HARMFUL = "potentially_harmful",
}

export enum QRCodeFormat {
  PNG = "png",
  SVG = "svg",
}

export enum QRCodeErrorCorrectionLevel {
  L = "L",
  M = "M",
  Q = "Q",
  H = "H",
}

export interface HitsByDay {
  date: string;
  count: number;
}

export interface Link {
  id: string;
  key: string;
  url: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  lastCall?: string;
  hitsCount: number;
  flashsCount: number;
  browsersCount?: Record<string, number>;
  deviceCount?: Record<string, number>;
  osCount?: Record<string, number>;
  countriesCount?: Record<string, number>;
  refererCount?: Record<string, number>;
  createdByType: LinkCreatedType;
  utm: boolean;
  utm_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  isEphemeral?: boolean;
  expiresAt?: string;
  ephemeralDuration?: EphemeralDuration;
  status: LinkStatus;
  healthStatus: LinkHealthStatus;
  safetyStatus?: SafetyStatus;
  hits?: HitsByDay[];
}

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
  format?: QRCodeFormat;
}

export interface CreateLinkDto {
  url: string;
  key?: string;
  title?: string;
  utm?: boolean;
  utm_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  isEphemeral?: boolean;
  ephemeralDuration?: EphemeralDuration;
  includeQrCode?: boolean;
  qrCodeOptions?: QRCodeOptions;
  createdByType?: LinkCreatedType;
}

export interface UpdateLinkDto {
  url?: string;
  key?: string;
  title?: string;
  utm?: boolean;
  utm_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  isEphemeral?: boolean;
  ephemeralDuration?: EphemeralDuration;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageCount: number;
  count: number;
}

export interface QRCodePngResponse {
  base64: string;
  dataUrl: string;
}

export interface QRCodeSvgResponse {
  svg: string;
}

export interface LinkWithQRCodeResponse {
  link: Link;
  shortUrl: string;
  qrCode?: QRCodePngResponse;
}

export interface CheckAvailabilityResponse {
  available: boolean;
}

export interface DeleteLinkResponse {
  success: boolean;
  message: string;
  deletedAt?: string;
  keyReleased?: boolean;
  archivedKey?: string;
}
