/**
 * Type Definitions
 * Centralized type definitions for the application
 */

import { Contact, LinkPrecedence } from '@prisma/client';

/**
 * Request body for the /identify endpoint
 */
export interface IdentifyRequest {
  email?: string | null;
  phoneNumber?: string | null;
}

/**
 * Response structure for the /identify endpoint
 */
export interface ContactResponse {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  contact: T;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Normalized contact information
 */
export interface NormalizedContactInfo {
  email?: string;
  phoneNumber?: string;
}

/**
 * Extended Contact type with utility methods
 */
export type ContactWithRelations = Contact & {
  linkedContacts?: Contact[];
};

/**
 * Contact linking result
 */
export interface ContactLinkingResult {
  primaryContact: Contact;
  allLinkedContacts: Contact[];
  needsNewContact: boolean;
}

