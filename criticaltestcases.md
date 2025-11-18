# Comprehensive Test Cases & Edge Cases

This file contains all test cases and edge cases for the Identity Reconciliation Service. Delete this file after testing is complete.

## Prerequisites

1. Start the server: `npm run dev`
2. Ensure PostgreSQL database is running
3. Use Postman, curl, or any REST client

**Base URL:** `http://localhost:3000`

---

## Test Case 1: Create New Primary Contact (No Existing Match)

**Purpose:** Verify new contact creation when no matches exist

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

**Database Check:**
- Contact ID 1 should have `linkPrecedence="primary"`, `linkedId=null`

---

## Test Case 2: Create Secondary Contact (Shared Phone)

**Purpose:** Verify secondary contact creation when sharing phone with existing contact

**Prerequisite:** Run Test Case 1 first

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

**Database Check:**
- Contact ID 2 should have `linkPrecedence="secondary"`, `linkedId=1`

---

## Test Case 3: Create Secondary Contact (Shared Email)

**Purpose:** Verify secondary contact creation when sharing email with existing contact

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "999888"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "999888"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Test Case 4: Query by Email Only

**Purpose:** Verify querying with only email returns consolidated contact

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "lorraine@hillvalley.edu"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "999888"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Verification:**
- No new contact created
- Returns all linked contacts

---

## Test Case 5: Query by Phone Only

**Purpose:** Verify querying with only phone returns consolidated contact

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "phoneNumber": "123456"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "999888"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Test Case 6: Query by Secondary Contact's Email

**Purpose:** Verify querying by secondary contact returns primary contact ID

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "mcfly@hillvalley.edu"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456", "999888"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Verification:**
- `primaryContatctId` is 1 (primary), not 2 or 3 (secondary)

---

## Test Case 7: Create Another Primary Contact (Separate)

**Purpose:** Verify creation of separate primary contact (not linked)

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "george@hillvalley.edu",
  "phoneNumber": "919191"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 4,
    "emails": ["george@hillvalley.edu"],
    "phoneNumbers": ["919191"],
    "secondaryContactIds": []
  }
}
```

**Database Check:**
- Contact ID 4 should have `linkPrecedence="primary"`, `linkedId=null`

---

## Test Case 8: Create Third Primary Contact

**Purpose:** Create another separate primary contact

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "biffsucks@hillvalley.edu",
  "phoneNumber": "717171"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 5,
    "emails": ["biffsucks@hillvalley.edu"],
    "phoneNumbers": ["717171"],
    "secondaryContactIds": []
  }
}
```

---

## Test Case 9: Merge Two Primary Contacts

**Purpose:** Verify merging when two primaries need to be linked (older stays primary)

**Prerequisites:** Run Test Cases 7 and 8 first

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": 4,
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["919191", "717171"],
    "secondaryContactIds": [5]
  }
}
```

**Database Check:**
- Contact ID 4 (older) remains `primary`, `linkedId=null`
- Contact ID 5 (newer) becomes `secondary`, `linkedId=4`

---

## Test Case 10: Transitive Linking (A-B-C Chain)

**Purpose:** Verify transitive linking (A shares email with B, B shares phone with C)

**Step 1 - Create Contact A:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "a@test.com",
  "phoneNumber": "111"
}
```

**Step 2 - Create Contact B (Shares Email with A):**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "a@test.com",
  "phoneNumber": "222"
}
```

**Step 3 - Create Contact C (Shares Phone with B):**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "c@test.com",
  "phoneNumber": "222"
}
```

**Expected Response for Step 3 (200):**
```json
{
  "contact": {
    "primaryContatctId": 6,
    "emails": ["a@test.com", "c@test.com"],
    "phoneNumbers": ["111", "222"],
    "secondaryContactIds": [7, 8]
  }
}
```

**Verification:**
- All three contacts (A, B, C) are linked to same primary
- All emails and phones from all three are included

---

## Test Case 11: Complex Transitive Linking

**Purpose:** Test complex multi-level transitive linking

**Step 1:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "x@test.com",
  "phoneNumber": "100"
}
```

**Step 2:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "y@test.com",
  "phoneNumber": "100"
}
```

**Step 3:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "y@test.com",
  "phoneNumber": "200"
}
```

**Step 4:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "z@test.com",
  "phoneNumber": "200"
}
```

**Expected:** All four contacts should be linked together

---

## Test Case 12: Edge Case - Both Email and Phone Null

**Purpose:** Verify error handling when both fields are null

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": null,
  "phoneNumber": null
}
```

**Expected Response (400):**
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

---

## Test Case 13: Edge Case - Both Email and Phone Empty Strings

**Purpose:** Verify error handling for empty strings

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "",
  "phoneNumber": ""
}
```

**Expected Response (400):**
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

---

## Test Case 14: Edge Case - Only Email Provided

**Purpose:** Verify single field (email only) works

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "emailonly@test.com"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": <number>,
    "emails": ["emailonly@test.com"],
    "phoneNumbers": [],
    "secondaryContactIds": []
  }
}
```

---

## Test Case 15: Edge Case - Only Phone Provided

**Purpose:** Verify single field (phone only) works

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "phoneNumber": "555666777"
}
```

**Expected Response (200):**
```json
{
  "contact": {
    "primaryContatctId": <number>,
    "emails": [],
    "phoneNumbers": ["555666777"],
    "secondaryContactIds": []
  }
}
```

---

## Test Case 16: Edge Case - Invalid Email Format

**Purpose:** Verify email validation

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "invalid-email",
  "phoneNumber": "123456"
}
```

**Expected Response (400):**
```json
{
  "error": "Invalid email format"
}
```

---

## Test Case 17: Edge Case - Invalid Phone Format

**Purpose:** Verify phone validation (non-numeric)

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "test@example.com",
  "phoneNumber": "abc123"
}
```

**Expected Response (400):**
```json
{
  "error": "Phone number must contain only digits"
}
```

---

## Test Case 18: Edge Case - Phone Too Short

**Purpose:** Verify phone length validation (minimum 7 digits)

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "test@example.com",
  "phoneNumber": "12345"
}
```

**Expected Response (400):**
```json
{
  "error": "Phone number must be between 7 and 15 digits"
}
```

---

## Test Case 19: Edge Case - Phone Too Long

**Purpose:** Verify phone length validation (maximum 15 digits)

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "test@example.com",
  "phoneNumber": "1234567890123456"
}
```

**Expected Response (400):**
```json
{
  "error": "Phone number must be between 7 and 15 digits"
}
```

---

## Test Case 20: Edge Case - Duplicate Request (Same Data)

**Purpose:** Verify no duplicate contacts created for identical requests

**Request (send twice):**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "duplicate@test.com",
  "phoneNumber": "888888"
}
```

**Expected:**
- First request: Creates new contact
- Second request: Returns existing contact, no new contact created

---

## Test Case 21: Edge Case - Whitespace Handling

**Purpose:** Verify trimming of whitespace

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "  whitespace@test.com  ",
  "phoneNumber": "  999888777  "
}
```

**Expected Response (200):**
- Email and phone should be trimmed
- Contact created/retrieved with trimmed values

---

## Test Case 22: Edge Case - Case Sensitivity (Email)

**Purpose:** Verify email case handling

**Step 1:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "CaseTest@Example.COM",
  "phoneNumber": "111222"
}
```

**Step 2:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "casetest@example.com",
  "phoneNumber": "333444"
}
```

**Expected:**
- Both should link together (emails are case-insensitive after normalization)
- Lowercase version stored

---

## Test Case 23: Edge Case - Multiple Secondaries to Same Primary

**Purpose:** Verify multiple secondaries can link to same primary

**Prerequisite:** Create primary contact first

**Request 1:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "primary@test.com",
  "phoneNumber": "111"
}
```

**Request 2:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "secondary1@test.com",
  "phoneNumber": "111"
}
```

**Request 3:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "secondary2@test.com",
  "phoneNumber": "111"
}
```

**Expected:**
- All three linked to same primary
- `secondaryContactIds` contains both secondary IDs

---

## Test Case 24: Edge Case - Merge Primary with Existing Secondaries

**Purpose:** Verify merging primary that already has secondaries

**Step 1 - Create Primary A with Secondary:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "primaryA@test.com",
  "phoneNumber": "100"
}
```

```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "secondaryA@test.com",
  "phoneNumber": "100"
}
```

**Step 2 - Create Primary B:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "primaryB@test.com",
  "phoneNumber": "200"
}
```

**Step 3 - Link them:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "primaryA@test.com",
  "phoneNumber": "200"
}
```

**Expected:**
- Primary A (older) stays primary
- Primary B becomes secondary
- Secondary A's `linkedId` remains pointing to Primary A
- All contacts in response

---

## Test Case 25: Edge Case - Phone with Special Characters

**Purpose:** Verify phone number with formatting characters

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "formatted@test.com",
  "phoneNumber": "+1 (555) 123-4567"
}
```

**Expected:**
- Special characters should be stripped
- Only digits stored: "15551234567"

---

## Test Case 26: Edge Case - Very Long Email

**Purpose:** Test with maximum length email

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "verylongemailaddressthatisstillvalid@verylongdomainname.example.com",
  "phoneNumber": "1234567"
}
```

**Expected Response (200):**
- Should accept valid long email

---

## Test Case 27: Edge Case - Special Characters in Email

**Purpose:** Verify email with special characters

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "user+tag@example.com",
  "phoneNumber": "1234567"
}
```

**Expected Response (200):**
- Should accept valid email with + character

---

## Test Case 28: Edge Case - Missing Request Body

**Purpose:** Verify error when body is missing

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{}
```

**Expected Response (400):**
```json
{
  "error": "Either email or phoneNumber must be provided"
}
```

---

## Test Case 29: Edge Case - Wrong Content-Type

**Purpose:** Verify proper JSON parsing

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: text/plain

email=test@example.com&phoneNumber=123456
```

**Expected:**
- Should fail or return error (depends on Express JSON parser)

---

## Test Case 30: Health Check Endpoint

**Purpose:** Verify health check works

**Request:**
```bash
GET http://localhost:3000/health
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-11-18T...",
  "service": "bitespeed-identity-reconciliation"
}
```

---

## Test Case 31: Edge Case - 404 for Invalid Endpoint

**Purpose:** Verify 404 handling

**Request:**
```bash
GET http://localhost:3000/invalid-endpoint
```

**Expected Response (404):**
```json
{
  "error": "Not Found",
  "message": "Cannot GET /invalid-endpoint"
}
```

---

## Test Case 32: Edge Case - Response Format Validation

**Purpose:** Verify response always has correct structure

**For any successful request, verify:**
- `contact.primaryContatctId` is a number
- `contact.emails` is an array of strings
- `contact.phoneNumbers` is an array of strings
- `contact.secondaryContactIds` is an array of numbers (sorted)
- Primary contact's email appears first in `emails` array
- Primary contact's phone appears first in `phoneNumbers` array

---

## Test Case 33: Edge Case - Database Consistency

**Purpose:** Verify database state after operations

**After running multiple tests, check:**
- Only one primary contact per linked group
- All secondaries have `linkedId` pointing to their primary
- No orphaned contacts (secondary without valid primary)
- `createdAt` timestamps are in order
- `updatedAt` updates when contacts are modified

---

## Test Case 34: Edge Case - Concurrent Requests

**Purpose:** Test handling of rapid concurrent requests

**Send multiple requests simultaneously:**
```bash
# Request 1
POST /identify
{"email": "concurrent1@test.com", "phoneNumber": "111"}

# Request 2 (immediately after)
POST /identify
{"email": "concurrent2@test.com", "phoneNumber": "222"}

# Request 3 (immediately after)
POST /identify
{"email": "concurrent3@test.com", "phoneNumber": "333"}
```

**Expected:**
- All requests should succeed
- No database conflicts
- Correct linking maintained

---

## Test Case 35: Edge Case - Large Response (Many Linked Contacts)

**Purpose:** Test with many linked contacts

**Create chain of 10+ linked contacts and verify:**
- Response includes all contacts
- Arrays are properly populated
- Performance is acceptable

---

## Test Case 36: Edge Case - Empty Arrays in Response

**Purpose:** Verify empty arrays when no data

**Request with only email (no phone):**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "emailonly2@test.com"
}
```

**Expected:**
- `phoneNumbers` should be empty array `[]`, not null

---

## Test Case 37: Edge Case - SQL Injection Attempt

**Purpose:** Verify SQL injection protection

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "test'; DROP TABLE contacts; --@test.com",
  "phoneNumber": "123456"
}
```

**Expected:**
- Should be treated as normal email (validation may reject)
- No SQL injection possible (Prisma handles this)

---

## Test Case 38: Edge Case - Unicode Characters

**Purpose:** Test with Unicode in email

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "tëst@éxämple.com",
  "phoneNumber": "1234567"
}
```

**Expected:**
- Should handle Unicode characters properly

---

## Test Case 39: Edge Case - Very Large Phone Number

**Purpose:** Test with maximum valid phone length

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "largephone@test.com",
  "phoneNumber": "123456789012345"
}
```

**Expected Response (200):**
- Should accept 15-digit phone number

---

## Test Case 40: Edge Case - Minimum Valid Phone Number

**Purpose:** Test with minimum valid phone length

**Request:**
```bash
POST http://localhost:3000/identify
Content-Type: application/json

{
  "email": "minphone@test.com",
  "phoneNumber": "1234567"
}
```

**Expected Response (200):**
- Should accept 7-digit phone number

---

## Complete Test Sequence

Run these in order for comprehensive testing:

1. Test Case 1 (Create Primary)
2. Test Case 2 (Create Secondary - Shared Phone)
3. Test Case 3 (Create Secondary - Shared Email)
4. Test Case 4 (Query by Email)
5. Test Case 5 (Query by Phone)
6. Test Case 6 (Query by Secondary Email)
7. Test Case 7 (Create Second Primary)
8. Test Case 8 (Create Third Primary)
9. Test Case 9 (Merge Primaries)
10. Test Case 10 (Transitive Linking)
11. Test Case 12 (Both Null - Error)
12. Test Case 13 (Both Empty - Error)
13. Test Case 14 (Email Only)
14. Test Case 15 (Phone Only)
15. Test Case 16 (Invalid Email)
16. Test Case 17 (Invalid Phone)
17. Test Case 20 (Duplicate Request)
18. Test Case 30 (Health Check)

---

## Verification Checklist

After running all tests, verify:

- [ ] All primary contacts have `linkPrecedence="primary"` and `linkedId=null`
- [ ] All secondary contacts have `linkPrecedence="secondary"` and valid `linkedId`
- [ ] No orphaned contacts (secondary without primary)
- [ ] Oldest contact is always primary in linked groups
- [ ] Response format matches specification exactly
- [ ] Primary contact info appears first in arrays
- [ ] `secondaryContactIds` are sorted ascending
- [ ] No duplicate contacts for same email/phone
- [ ] Transitive linking works correctly
- [ ] Primary merging works correctly
- [ ] Error handling works for invalid inputs
- [ ] Health check endpoint works
- [ ] 404 handling works for invalid endpoints

---

## Notes

- Delete this file after testing is complete
- Use Postman Collection Runner for automated testing
- Check database using `npm run prisma:studio` after tests
- Verify logs in server console for any errors

