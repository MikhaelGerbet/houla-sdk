// Configuration
export { DEFAULT_CONFIG, createConfig } from "./config";
export type { HoulaConfig } from "./config";

// Client
export { HoulaClient, createHoulaClient } from "./client";

// Types - Enums
export {
  LinkHealthStatus,
  LinkStatus,
  LinkCreatedType,
  EphemeralDuration,
  SafetyStatus,
  QRCodeFormat,
  QRCodeErrorCorrectionLevel,
  WebhookEvent,
} from "./types";

// Types - Interfaces
export type {
  HitsByDay,
  Link,
  QRCodeOptions,
  CreateLinkDto,
  UpdateLinkDto,
  PaginatedResponse,
  QRCodePngResponse,
  QRCodeSvgResponse,
  CheckAvailabilityResponse,
  DeleteLinkResponse,
  LinkRule,
  LinkRuleCondition,
  CreateLinkRuleDto,
  UpdateLinkRuleDto,
  RuleMatchType,
  RuleConditionField,
  RuleConditionOperator,
  Webhook,
  WebhookWithSecret,
  CreateWebhookDto,
  UpdateWebhookDto,
  WebhookLog,
  WebhookStats,
  TestWebhookResult,
} from "./types";
