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
} from "./types";
