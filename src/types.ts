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
  shortUrl?: string;
  flashUrl?: string;
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
  createdByType?: LinkCreatedType;
  /** Custom expiration date (ISO 8601). Mutually exclusive with ephemeralDuration. Key is NOT recycled. */
  customExpiresAt?: string;
  /** Protect link with a password */
  isPasswordProtected?: boolean;
  /** Password for protected link */
  password?: string;
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
  /** Custom expiration date (ISO 8601), or null to remove expiration */
  customExpiresAt?: string | null;
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

// ─── Smart Routing (Link Rules) ───

export type RuleMatchType = "all" | "any";

export type RuleConditionField =
  | "country" | "continent"
  | "device" | "os" | "browser" | "language"
  | "referrer" | "social_media"
  | "day_of_week" | "hour" | "date_range"
  | "is_bot" | "is_first_visit";

export type RuleConditionOperator =
  | "equals" | "not_equals"
  | "contains" | "not_contains"
  | "in" | "not_in"
  | "starts_with"
  | "greater_than" | "less_than"
  | "between" | "not_between";

export interface LinkRuleCondition {
  id?: string;
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

export interface LinkRule {
  id: string;
  linkId: string;
  priority: number;
  label: string;
  destinationUrl: string;
  matchType: RuleMatchType;
  isActive: boolean;
  /** Weight for A/B testing (0-100). Rules with weight > 0 and no conditions are A/B variants */
  weight: number;
  conditions: LinkRuleCondition[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLinkRuleDto {
  label: string;
  destinationUrl: string;
  matchType?: RuleMatchType;
  isActive?: boolean;
  /** Weight for A/B testing (0-100) */
  weight?: number;
  conditions: Omit<LinkRuleCondition, "id">[];
}

export interface UpdateLinkRuleDto {
  label?: string;
  destinationUrl?: string;
  matchType?: RuleMatchType;
  isActive?: boolean;
  /** Weight for A/B testing (0-100) */
  weight?: number;
  conditions?: Omit<LinkRuleCondition, "id">[];
}

// ─── Webhooks ───

export enum WebhookEvent {
  LINK_CLICKED = "link.clicked",
  LINK_CREATED = "link.created",
  LINK_UPDATED = "link.updated",
  LINK_DELETED = "link.deleted",
  LINK_HEALTH_CHANGED = "link.health_changed",
  LINK_SAFETY_CHANGED = "link.safety_changed",
  LINK_EXPIRED = "link.expired",
  LINK_PASSWORD_ATTEMPT = "link.password_attempt",
  PROFILE_VISITED = "profile.visited",
  PROFILE_LINK_CLICKED = "profile.link_clicked",
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  consecutiveFailures: number;
  disabledReason?: string;
  disabledAt?: string;
  linkId?: string;
  tagId?: string;
  batchSize: number;
  batchDelayMs: number;
  samplingRate: number;
  anonymizeIp: boolean;
  excludeGeoCity: boolean;
  totalDelivered: number;
  totalFailed: number;
  lastDeliveredAt?: string;
  lastFailedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookWithSecret extends Webhook {
  secret: string;
}

export interface CreateWebhookDto {
  name: string;
  url: string;
  events: WebhookEvent[];
  linkId?: string;
  tagId?: string;
  batchSize?: number;
  batchDelayMs?: number;
  samplingRate?: number;
  anonymizeIp?: boolean;
  excludeGeoCity?: boolean;
}

export interface UpdateWebhookDto {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  linkId?: string;
  tagId?: string;
  batchSize?: number;
  batchDelayMs?: number;
  samplingRate?: number;
  anonymizeIp?: boolean;
  excludeGeoCity?: boolean;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload?: Record<string, any>;
  eventCount: number;
  success: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  errorMessage?: string;
  attempt: number;
  createdAt: string;
}

export interface WebhookStats {
  totalWebhooks: number;
  activeWebhooks: number;
  disabledWebhooks: number;
  totalDelivered24h: number;
  totalFailed24h: number;
  successRate: number;
}

export interface TestWebhookResult {
  success: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  errorMessage?: string;
}

