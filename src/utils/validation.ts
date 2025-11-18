/**
 * Validation Utilities
 * Input validation and sanitization functions
 */

import { ValidationError } from './errors';
import { NormalizedContactInfo } from '../types';

/**
 * Validates and normalizes email address
 * @param email - Email address to validate
 * @returns Normalized email or undefined
 */
export function validateAndNormalizeEmail(email: unknown): string | undefined {
  if (!email) return undefined;
  
  if (typeof email !== 'string') {
    throw new ValidationError('Email must be a string');
  }

  const trimmed = email.trim();
  if (trimmed === '') return undefined;

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    throw new ValidationError('Invalid email format');
  }

  return trimmed.toLowerCase();
}

/**
 * Validates and normalizes phone number
 * @param phoneNumber - Phone number to validate
 * @returns Normalized phone number or undefined
 */
export function validateAndNormalizePhone(phoneNumber: unknown): string | undefined {
  if (!phoneNumber) return undefined;

  const phoneStr = phoneNumber.toString().trim();
  if (phoneStr === '') return undefined;

  // Remove common phone number formatting characters
  const cleaned = phoneStr.replace(/[\s\-\(\)\+]/g, '');
  
  // Basic validation: should contain only digits and be reasonable length
  if (!/^\d+$/.test(cleaned)) {
    throw new ValidationError('Phone number must contain only digits');
  }

  if (cleaned.length < 7 || cleaned.length > 15) {
    throw new ValidationError('Phone number must be between 7 and 15 digits');
  }

  return cleaned;
}

/**
 * Validates and normalizes contact information
 * @param email - Email address
 * @param phoneNumber - Phone number
 * @returns Normalized contact information
 * @throws {ValidationError} If both email and phoneNumber are missing
 */
export function validateAndNormalizeContactInfo(
  email: unknown,
  phoneNumber: unknown
): NormalizedContactInfo {
  const normalizedEmail = validateAndNormalizeEmail(email);
  const normalizedPhone = validateAndNormalizePhone(phoneNumber);

  if (!normalizedEmail && !normalizedPhone) {
    throw new ValidationError('Either email or phoneNumber must be provided');
  }

  return {
    email: normalizedEmail,
    phoneNumber: normalizedPhone,
  };
}

