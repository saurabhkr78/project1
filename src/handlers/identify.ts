/**
 * Identify Handler
 * Handles identity reconciliation requests
 */

import { Request, Response } from 'express';
import { Contact } from '@prisma/client';
import { ContactResponse, ApiResponse, NormalizedContactInfo } from '../types';
import { validateAndNormalizeContactInfo } from '../utils/validation';
import { logger } from '../utils/logger';
import {
  findMatchingContacts,
  findAllContactsToLink,
  findPrimaryContact,
  getAllLinkedContacts,
  shouldCreateNewContact,
  createPrimaryContact,
  createSecondaryContact,
  linkContactsToPrimary,
} from '../services/contactService';

/**
 * Builds the response object from contact data
 */
function buildResponse(
  primaryContact: Contact,
  allLinkedContacts: Contact[]
): ApiResponse<ContactResponse> {
  const emails: string[] = [];
  const phoneNumbers: string[] = [];
  const secondaryContactIds: number[] = [];
  const addedEmails = new Set<string>();
  const addedPhones = new Set<string>();

  // Add primary contact info first (required by spec)
  if (primaryContact.email && !addedEmails.has(primaryContact.email)) {
    emails.push(primaryContact.email);
    addedEmails.add(primaryContact.email);
  }
  if (primaryContact.phoneNumber && !addedPhones.has(primaryContact.phoneNumber)) {
    phoneNumbers.push(primaryContact.phoneNumber);
    addedPhones.add(primaryContact.phoneNumber);
  }

  // Add secondary contacts
  for (const contact of allLinkedContacts) {
    if (contact.id === primaryContact.id) {
      continue;
    }

    secondaryContactIds.push(contact.id);

    if (contact.email && !addedEmails.has(contact.email)) {
      emails.push(contact.email);
      addedEmails.add(contact.email);
    }
    if (contact.phoneNumber && !addedPhones.has(contact.phoneNumber)) {
      phoneNumbers.push(contact.phoneNumber);
      addedPhones.add(contact.phoneNumber);
    }
  }

  return {
    contact: {
      primaryContatctId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryContactIds.sort((a, b) => a - b),
    },
  };
}

/**
 * Identify handler - Main endpoint for identity reconciliation
 * POST /identify
 */
export async function identifyHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, phoneNumber } = req.body;

    logger.debug('Received identify request', { email: email ? '***' : undefined, phoneNumber: phoneNumber ? '***' : undefined });

    // Validate and normalize input
    const contactInfo: NormalizedContactInfo = validateAndNormalizeContactInfo(email, phoneNumber);

    // Find matching contacts
    const matchingContacts = await findMatchingContacts(
      contactInfo.email,
      contactInfo.phoneNumber
    );

    // If no matches, create new primary contact
    if (matchingContacts.length === 0) {
      logger.info('No matching contacts found, creating new primary contact');
      const newContact = await createPrimaryContact(contactInfo);

      const response: ApiResponse<ContactResponse> = {
        contact: {
          primaryContatctId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
          secondaryContactIds: [],
        },
      };

      res.status(200).json(response);
      return;
    }

    // Find all contacts that should be linked together
    const allContactsToLink = await findAllContactsToLink(
      matchingContacts,
      contactInfo.email,
      contactInfo.phoneNumber
    );

    // Find the primary contact (oldest one)
    const primaryContact = await findPrimaryContact(allContactsToLink);

    // Link all contacts that should be linked but aren't yet
    await linkContactsToPrimary(allContactsToLink, primaryContact);

    // Get all currently linked contacts
    const allLinkedContacts = await getAllLinkedContacts(primaryContact.id);

    // Check if we need to create a new secondary contact
    const needsNewContact = shouldCreateNewContact(
      allLinkedContacts,
      contactInfo.email,
      contactInfo.phoneNumber
    );

    if (needsNewContact) {
      logger.info('New contact information detected, creating secondary contact', {
        primaryContactId: primaryContact.id,
      });
      await createSecondaryContact(contactInfo, primaryContact.id);

      // Refresh linked contacts
      const updatedLinkedContacts = await getAllLinkedContacts(primaryContact.id);
      const response = buildResponse(primaryContact, updatedLinkedContacts);
      res.status(200).json(response);
      return;
    }

    // No new contact needed, return existing consolidated contact
    logger.debug('Returning existing consolidated contact', {
      primaryContactId: primaryContact.id,
      linkedContactsCount: allLinkedContacts.length,
    });
    const response = buildResponse(primaryContact, allLinkedContacts);
    res.status(200).json(response);
  } catch (error) {
    // Error will be handled by errorHandler middleware
    throw error;
  }
}
