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
  CustomDomainStatus,
  VerificationMethod,
  BioPageType,
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
  OgImageUploadResponse,
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
  CustomDomain,
  CreateCustomDomainDto,
  BioPageSummary,
  BioPage,
  CreateBioPageDto,
  UpdateBioPageDto,
  AttachCustomDomainToBioPageDto,
} from "./types";
