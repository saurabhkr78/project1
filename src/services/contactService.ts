/**
 * Contact Service
 * Business logic for contact identity reconciliation
 */

import { Contact } from '@prisma/client';
import { DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';
import { NormalizedContactInfo } from '../types';
import { prisma } from '../database/prisma';

/**
 * Finds contacts matching the provided email or phone number
 */
export async function findMatchingContacts(
  email?: string,
  phoneNumber?: string
): Promise<Contact[]> {
  try {
    const conditions: Array<{ email?: string } | { phoneNumber?: string }> = [];

    if (email) {
      conditions.push({ email });
    }
    if (phoneNumber) {
      conditions.push({ phoneNumber });
    }

    if (conditions.length === 0) {
      return [];
    }

    return await prisma.contact.findMany({
      where: {
        OR: conditions,
        deletedAt: null,
      },
    });
  } catch (error) {
    logger.error('Error finding matching contacts', error);
    throw new DatabaseError('Failed to find matching contacts');
  }
}

/**
 * Finds all contacts that should be linked together transitively
 */
export async function findAllContactsToLink(
  matchingContacts: Contact[],
  email?: string,
  phoneNumber?: string
): Promise<Contact[]> {
  try {
    const contactsToLink = new Set<number>(matchingContacts.map(c => c.id));
    const allEmails = new Set<string>();
    const allPhones = new Set<string>();

    // Add emails and phones from matching contacts
    for (const contact of matchingContacts) {
      if (contact.email) allEmails.add(contact.email);
      if (contact.phoneNumber) allPhones.add(contact.phoneNumber);
    }

    // Add request emails/phones
    if (email) allEmails.add(email);
    if (phoneNumber) allPhones.add(phoneNumber);

    // Find all contacts that share any email or phone with our set (transitive linking)
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      const emailArray = Array.from(allEmails);
      const phoneArray = Array.from(allPhones);

      const orConditions: Array<{ email: { in: string[] } } | { phoneNumber: { in: string[] } }> = [];
      if (emailArray.length > 0) {
        orConditions.push({ email: { in: emailArray } });
      }
      if (phoneArray.length > 0) {
        orConditions.push({ phoneNumber: { in: phoneArray } });
      }

      if (orConditions.length === 0) {
        break;
      }

      const contacts = await prisma.contact.findMany({
        where: {
          OR: orConditions,
          deletedAt: null,
        },
      });

      for (const contact of contacts) {
        if (!contactsToLink.has(contact.id)) {
          contactsToLink.add(contact.id);
          foundNew = true;
          if (contact.email) allEmails.add(contact.email);
          if (contact.phoneNumber) allPhones.add(contact.phoneNumber);

          // Follow existing link chains
          if (contact.linkPrecedence === 'primary') {
            const secondaries = await prisma.contact.findMany({
              where: {
                linkedId: contact.id,
                deletedAt: null,
              },
            });
            for (const secondary of secondaries) {
              if (!contactsToLink.has(secondary.id)) {
                contactsToLink.add(secondary.id);
                foundNew = true;
                if (secondary.email) allEmails.add(secondary.email);
                if (secondary.phoneNumber) allPhones.add(secondary.phoneNumber);
              }
            }
          } else if (contact.linkedId) {
            const primary = await prisma.contact.findUnique({
              where: { id: contact.linkedId },
            });
            if (primary && !contactsToLink.has(primary.id)) {
              contactsToLink.add(primary.id);
              foundNew = true;
              if (primary.email) allEmails.add(primary.email);
              if (primary.phoneNumber) allPhones.add(primary.phoneNumber);
            }

            const siblings = await prisma.contact.findMany({
              where: {
                linkedId: contact.linkedId,
                deletedAt: null,
              },
            });
            for (const sibling of siblings) {
              if (!contactsToLink.has(sibling.id)) {
                contactsToLink.add(sibling.id);
                foundNew = true;
                if (sibling.email) allEmails.add(sibling.email);
                if (sibling.phoneNumber) allPhones.add(sibling.phoneNumber);
              }
            }
          }
        }
      }
    }

    const contactIds = Array.from(contactsToLink);
    if (contactIds.length === 0) {
      return [];
    }

    return await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        deletedAt: null,
      },
    });
  } catch (error) {
    logger.error('Error finding contacts to link', error);
    throw new DatabaseError('Failed to find contacts to link');
  }
}

/**
 * Finds the primary contact among a set of contacts
 */
export async function findPrimaryContact(contacts: Contact[]): Promise<Contact> {
  if (contacts.length === 0) {
    throw new Error('No contacts provided');
  }

  const primaryContacts = contacts.filter((c) => c.linkPrecedence === 'primary');

  if (primaryContacts.length > 0) {
    return primaryContacts.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0];
  }

  const linkedIds = contacts
    .map((c) => c.linkedId)
    .filter((id): id is number => id !== null);

  if (linkedIds.length > 0) {
    const primaries = await prisma.contact.findMany({
      where: {
        id: { in: linkedIds },
        linkPrecedence: 'primary',
        deletedAt: null,
      },
    });

    if (primaries.length > 0) {
      return primaries.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
    }
  }

  return contacts.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )[0];
}

/**
 * Gets all contacts linked to a primary contact
 */
export async function getAllLinkedContacts(primaryId: number): Promise<Contact[]> {
  try {
    const primary = await prisma.contact.findUnique({
      where: { id: primaryId },
    });

    if (!primary) {
      return [];
    }

    const secondaryContacts = await prisma.contact.findMany({
      where: {
        linkedId: primaryId,
        deletedAt: null,
      },
    });

    return [primary, ...secondaryContacts];
  } catch (error) {
    logger.error('Error getting linked contacts', error);
    throw new DatabaseError('Failed to get linked contacts');
  }
}

/**
 * Checks if a new contact needs to be created
 */
export function shouldCreateNewContact(
  existingContacts: Contact[],
  email?: string,
  phoneNumber?: string
): boolean {
  const existingEmails = new Set(
    existingContacts.map((c) => c.email).filter((e): e is string => e !== null)
  );
  const existingPhones = new Set(
    existingContacts
      .map((c) => c.phoneNumber)
      .filter((p): p is string => p !== null)
  );

  const hasNewEmail = email ? !existingEmails.has(email) : false;
  const hasNewPhone = phoneNumber ? !existingPhones.has(phoneNumber) : false;

  return hasNewEmail || hasNewPhone;
}

/**
 * Creates a new primary contact
 */
export async function createPrimaryContact(
  contactInfo: NormalizedContactInfo
): Promise<Contact> {
  try {
    return await prisma.contact.create({
      data: {
        email: contactInfo.email || null,
        phoneNumber: contactInfo.phoneNumber || null,
        linkPrecedence: 'primary',
        linkedId: null,
      },
    });
  } catch (error) {
    logger.error('Error creating primary contact', error);
    throw new DatabaseError('Failed to create primary contact');
  }
}

/**
 * Creates a new secondary contact
 */
export async function createSecondaryContact(
  contactInfo: NormalizedContactInfo,
  primaryId: number
): Promise<Contact> {
  try {
    return await prisma.contact.create({
      data: {
        email: contactInfo.email || null,
        phoneNumber: contactInfo.phoneNumber || null,
        linkPrecedence: 'secondary',
        linkedId: primaryId,
      },
    });
  } catch (error) {
    logger.error('Error creating secondary contact', error);
    throw new DatabaseError('Failed to create secondary contact');
  }
}

/**
 * Links contacts to a primary contact
 */
export async function linkContactsToPrimary(
  contacts: Contact[],
  primaryContact: Contact
): Promise<void> {
  try {
    const currentlyLinked = await getAllLinkedContacts(primaryContact.id);
    const currentlyLinkedIds = new Set(currentlyLinked.map(c => c.id));

    for (const contact of contacts) {
      if (contact.id === primaryContact.id) {
        continue;
      }

      if (!currentlyLinkedIds.has(contact.id)) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            linkPrecedence: 'secondary',
            linkedId: primaryContact.id,
          },
        });

        if (contact.linkPrecedence === 'primary') {
          const secondaries = await prisma.contact.findMany({
            where: {
              linkedId: contact.id,
              deletedAt: null,
            },
          });

          for (const secondary of secondaries) {
            await prisma.contact.update({
              where: { id: secondary.id },
              data: {
                linkedId: primaryContact.id,
              },
            });
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error linking contacts to primary', error);
    throw new DatabaseError('Failed to link contacts to primary');
  }
}

