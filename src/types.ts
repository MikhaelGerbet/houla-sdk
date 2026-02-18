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
  /** Facebook Pixel ID for retargeting */
  fbPixelId?: string;
  /** Google Tag ID (gtag.js) for retargeting */
  googleTagId?: string;
  /** TikTok Pixel ID for retargeting */
  tiktokPixelId?: string;
  /** Custom domain ID (UUID) — links the short URL to a custom domain */
  customDomainId?: string;
  /** Maximum number of clicks before the link expires (null = unlimited) */
  maxHits?: number;
  /** Whether destination URL is hidden via iframe cloaking */
  isCloaked?: boolean;
  /** Tags associated with this link */
  tags?: Tag[];

  /** Open Graph title for social link previews */
  ogTitle?: string;
  /** Open Graph description for social link previews */
  ogDescription?: string;
  /** Open Graph image URL for social link previews */
  ogImageUrl?: string;
  /** Timestamp of last OG crawl */
  ogCrawledAt?: string;
  /** OG crawl status: pending, success, failed, manual */
  ogCrawlStatus?: string;

  /** iOS deep link URI scheme or Universal Link (max 2048 chars) */
  deepLinkIos?: string;
  /** Android deep link URI scheme or Intent URL (max 2048 chars) */
  deepLinkAndroid?: string;
  /** Fallback URL (App Store / Play Store) when app is not installed (max 2048 chars) */
  deepLinkFallbackUrl?: string;
  /** ID of the automatically detected platform (read-only, set by the API) */
  platformDeepLinkId?: string;
  /** Whether deep links were auto-detected (true) or manually set (false) */
  deepLinkAutoDetected?: boolean;
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
  /** Facebook Pixel ID (10-20 digits) for retargeting */
  fbPixelId?: string;
  /** Google Tag ID (G-XXX, AW-XXX, DC-XXX, UA-XXX) for retargeting */
  googleTagId?: string;
  /** TikTok Pixel ID (CXXX...) for retargeting */
  tiktokPixelId?: string;
  /** Custom domain ID (UUID) to use for this link's short URL */
  customDomainId?: string;
  /** Maximum number of clicks allowed (1 - 1,000,000). Link expires when reached. */
  maxHits?: number;
  /** Enable Link Cloaking to hide the destination URL in the browser address bar */
  isCloaked?: boolean;
  /** Custom OG title for social link previews (max 200 chars) */
  ogTitle?: string;
  /** Custom OG description for social link previews (max 500 chars) */
  ogDescription?: string;
  /** Custom OG image URL for social link previews (max 2048 chars) */
  ogImageUrl?: string;
  /** Array of tag IDs (UUIDs) to associate with this link */
  tagIds?: string[];
  /** iOS deep link URI scheme or Universal Link (max 2048 chars) */
  deepLinkIos?: string;
  /** Android deep link URI scheme or Intent URL (max 2048 chars) */
  deepLinkAndroid?: string;
  /** Fallback URL (App Store / Play Store) when app is not installed (max 2048 chars) */
  deepLinkFallbackUrl?: string;
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
  /** Facebook Pixel ID, or null to remove */
  fbPixelId?: string | null;
  /** Google Tag ID, or null to remove */
  googleTagId?: string | null;
  /** TikTok Pixel ID, or null to remove */
  tiktokPixelId?: string | null;
  /** Custom domain ID, or null to remove */
  customDomainId?: string | null;
  /** Maximum number of clicks, or null to remove the limit */
  maxHits?: number | null;
  /** Enable or disable Link Cloaking (true/false) */
  isCloaked?: boolean;
  /** Custom OG title, or null to remove */
  ogTitle?: string | null;
  /** Custom OG description, or null to remove */
  ogDescription?: string | null;
  /** Custom OG image URL, or null to remove */
  ogImageUrl?: string | null;
  /** Array of tag IDs (UUIDs) to associate, or empty array to remove all tags */
  tagIds?: string[];
  /** iOS deep link URI scheme or Universal Link, or null to remove */
  deepLinkIos?: string | null;
  /** Android deep link URI scheme or Intent URL, or null to remove */
  deepLinkAndroid?: string | null;
  /** Fallback URL (App Store / Play Store), or null to remove */
  deepLinkFallbackUrl?: string | null;
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

export interface OgImageUploadResponse {
  /** Public URL of the uploaded OG image (Cloudflare R2) */
  ogImageUrl: string;
  /** R2 storage key (internal) */
  ogImageR2Key: string;
}

// ─── Smart Routing (Link Rules) ───

// ─── Tags ───

export interface Tag {
  /** Unique tag identifier (UUID) */
  id: string;
  /** Tag display name (1-50 characters) */
  name: string;
  /** Tag color in hex format (#RRGGBB) */
  color?: string;
  /** Creation date (ISO 8601) */
  createdAt: string;
  /** Last update date (ISO 8601) */
  updatedAt?: string;
}

export interface CreateTagDto {
  /** Tag name (1-50 characters, required) */
  name: string;
  /** Tag color in hex format (#RRGGBB, optional) */
  color?: string;
}

export interface UpdateTagDto {
  /** Tag name (1-50 characters) */
  name?: string;
  /** Tag color in hex format (#RRGGBB) */
  color?: string;
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

// ─── Pixel Presets ───

export interface PixelPreset {
  id: string;
  /** Display name for this preset */
  name: string;
  /** Whether this preset is automatically applied to new links */
  isDefault: boolean;
  /** Facebook Pixel ID (10-20 digits) */
  fbPixelId?: string;
  /** Google Tag ID (G-XXX, AW-XXX, DC-XXX, UA-XXX) */
  googleTagId?: string;
  /** TikTok Pixel ID (CXXX...) */
  tiktokPixelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePixelPresetDto {
  /** Display name for the preset */
  name: string;
  /** Set as default preset for new links */
  isDefault?: boolean;
  /** Facebook Pixel ID (10-20 digits) */
  fbPixelId?: string;
  /** Google Tag ID (G-XXX, AW-XXX, DC-XXX, UA-XXX) */
  googleTagId?: string;
  /** TikTok Pixel ID (CXXX...) */
  tiktokPixelId?: string;
}

export interface UpdatePixelPresetDto {
  /** Display name for the preset */
  name?: string;
  /** Set as default preset for new links */
  isDefault?: boolean;
  /** Facebook Pixel ID, or null to remove */
  fbPixelId?: string | null;
  /** Google Tag ID, or null to remove */
  googleTagId?: string | null;
  /** TikTok Pixel ID, or null to remove */
  tiktokPixelId?: string | null;
}

// ─── Custom Domains ───

export enum CustomDomainStatus {
  PENDING = "pending",
  DNS_PENDING = "dns_pending",
  DNS_VERIFIED = "dns_verified",
  SSL_PENDING = "ssl_pending",
  ACTIVE = "active",
  FAILED = "failed",
  SUSPENDED = "suspended",
}

export enum VerificationMethod {
  CNAME = "cname",
  TXT = "txt",
}

export interface CustomDomain {
  /** UUID */
  id: string;
  /** The custom domain name (e.g. "go.example.com") */
  domain: string;
  /** Owner user ID */
  ownerId: string;
  /** Current domain status */
  status: CustomDomainStatus;
  /** Verification method (CNAME or TXT) */
  verificationMethod: VerificationMethod;
  /** Token for TXT record verification */
  verificationToken?: string;
  /** Whether DNS has been verified */
  dnsVerified: boolean;
  /** Date when DNS was verified */
  dnsVerifiedAt?: string;
  /** Whether SSL certificate is configured */
  sslConfigured: boolean;
  /** Date of last DNS check */
  lastDnsCheckAt?: string;
  /** Error message from last DNS check */
  lastDnsCheckError?: string;
  /** CNAME target for DNS configuration */
  cnameTarget?: string;
  /** TXT record name for verification */
  txtRecordName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomDomainDto {
  /** The domain name to register (e.g. "go.example.com") */
  domain: string;
}

// ─── Bio Pages (Multi Link-in-Bio) ───

/** Type of bio page */
export enum BioPageType {
  STANDARD = "standard",
  SHOP = "shop",
}

/** Summary of a bio page (returned by list endpoint) */
export interface BioPageSummary {
  /** UUID */
  id: string;
  /** Username for this page's URL (@username) */
  username: string;
  /** Slug for legacy sub-pages (null for standard pages) */
  slug: string | null;
  /** Display name shown on the page */
  displayName: string;
  /** Whether this is the default page */
  isDefault: boolean;
  /** Page type */
  pageType: BioPageType;
  /** Custom domain ID attached to this page */
  customDomainId?: string | null;
  /** Whether the page is publicly visible */
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Full bio page details */
export interface BioPage extends BioPageSummary {
  /** Username of the owner */
  username: string;
  /** Short bio text */
  bio: string | null;
  /** Avatar URL */
  avatarUrl: string | null;
  /** Banner URL */
  bannerUrl: string | null;
  /** Visual theme */
  theme: string;
  /** Primary color (hex or rgba) */
  primaryColor: string | null;
  /** Background color (hex, rgba or gradient) */
  backgroundColor: string | null;
  /** Background image URL */
  backgroundImageUrl: string | null;
  /** Background overlay opacity (0-100) */
  backgroundOverlayOpacity: number | null;
  /** Button color */
  buttonColor: string | null;
  /** Button text color */
  buttonTextColor: string | null;
  /** Button blur (0-30 px) */
  buttonBlur: number | null;
  /** Button opacity (0-100%) */
  buttonOpacity: number | null;
  /** Text color */
  textColor: string | null;
  /** Whether avatar is shown */
  showAvatar: boolean;
}

export interface CreateBioPageDto {
  /** Username for the page URL (3-30 chars, a-zA-Z0-9_-) */
  username: string;
  /** Display name for the page */
  displayName: string;
  /** Short bio text (max 160 chars) */
  bio?: string;
  /** Page type */
  pageType?: BioPageType;
  /** Custom domain ID (UUID) to attach */
  customDomainId?: string;
  /** Design preset ID (UUID) to apply */
  presetId?: string;
}

export interface UpdateBioPageDto {
  /** Display name */
  displayName?: string;
  /** Short bio text (max 160 chars) */
  bio?: string;
  /** Page type */
  pageType?: BioPageType;
  /** Custom domain ID (UUID), or null to detach */
  customDomainId?: string | null;
}

export interface AttachCustomDomainToBioPageDto {
  /** Custom domain ID (UUID), or null to detach */
  customDomainId?: string | null;
}

// ─── Workspaces ───

/** Workspace type */
export enum WorkspaceType {
  PERSONAL = "personal",
  TEAM = "team",
}

/** Workspace plan */
export enum WorkspacePlan {
  FREE = "free",
  PRO = "pro",
  BUSINESS = "business",
  ENTERPRISE = "enterprise",
}

/** Workspace member role */
export enum WorkspaceRole {
  OWNER = "owner",
  MEMBER = "member",
  VIEWER = "viewer",
}

/** Workspace summary (returned by list endpoint) */
export interface Workspace {
  /** UUID */
  id: string;
  /** Display name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** personal or team */
  type: WorkspaceType;
  /** Optional description */
  description?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** Owner user ID */
  ownerId: string;
  /** Subscription plan */
  plan: WorkspacePlan;
  /** Max team members */
  maxMembers: number;
  /** Max links (null = unlimited) */
  maxLinks?: number;
  /** Max custom domains */
  maxCustomDomains: number;
  /** Max API keys */
  maxApiKeys: number;
  createdAt: string;
  updatedAt: string;
}

/** Workspace member */
export interface WorkspaceMember {
  /** UUID */
  id: string;
  /** Workspace ID */
  workspaceId: string;
  /** User ID */
  userId: string;
  /** Member role */
  role: WorkspaceRole;
  /** When the member joined */
  joinedAt?: string;
  createdAt: string;
}

/** Workspace invitation */
export interface WorkspaceInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  /** Invitation token */
  token: string;
  /** When the invite expires */
  expiresAt: string;
  createdAt: string;
}

export interface CreateWorkspaceDto {
  /** Workspace name (1-100 chars) */
  name: string;
  /** Optional description (max 500 chars) */
  description?: string;
}

export interface UpdateWorkspaceDto {
  /** Workspace name (1-100 chars) */
  name?: string;
  /** Description (max 500 chars) */
  description?: string;
}

export interface InviteMemberDto {
  /** Email to invite */
  email: string;
  /** Role to assign (member or viewer, default: member) */
  role?: WorkspaceRole.MEMBER | WorkspaceRole.VIEWER;
}

export interface UpdateMemberRoleDto {
  /** New role (member or viewer) */
  role: WorkspaceRole.MEMBER | WorkspaceRole.VIEWER;
}

export interface TransferOwnershipDto {
  /** UUID of the new owner */
  newOwnerId: string;
}

