# Standard Operating Procedures by Intent

*Generated: 2026-01-30 07:22*
*Based on 486 analyzed calls*

---

## Speak With Staff

**Volume:** 116 calls (23.9% of total)
**Resolution Rate:** 94.8%

### Caller Profile

- `existing_client`: 46 (39.7%)
- `insurance_rep`: 31 (26.7%)
- `law_office`: 16 (13.8%)
- `business_vendor`: 10 (8.6%)
- `medical_provider`: 7 (6.0%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `transfer_attempted` | 69 | 59.5% |
| `message_taken` | 35 | 30.2% |
| `interaction_failed` | 4 | 3.4% |
| `callback_scheduled` | 3 | 2.6% |
| `information_provided` | 3 | 2.6% |
| `unresolved_staff_unavailable` | 2 | 1.7% |

### Routing Destinations

- `specific_staff_member`: 49 (42.2%)
- `no_transfer`: 47 (40.5%)
- `legal_counsel`: 11 (9.5%)
- `unspecified_internal_transfer`: 6 (5.2%)
- `case_management`: 3 (2.6%)

### SOP Summary

> **WHEN** caller intent is `speak_with_staff`
> **THEN** primary action is `transfer_attempted` (59% of cases)
> **ROUTE TO** `specific_staff_member` (42% of cases)
> **EXPECTED RESOLUTION RATE** 95%

---

## Unknown Or Undetermined

**Volume:** 74 calls (15.2% of total)
**Resolution Rate:** 13.5%

### Caller Profile

- `new_client`: 59 (79.7%)
- `spanish_speaker`: 8 (10.8%)
- `business_vendor`: 4 (5.4%)
- `existing_client`: 2 (2.7%)
- `medical_provider`: 1 (1.4%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `interaction_failed` | 64 | 86.5% |
| `information_provided` | 5 | 6.8% |
| `transfer_attempted` | 4 | 5.4% |
| `callback_scheduled` | 1 | 1.4% |

### Routing Destinations

- `no_transfer`: 70 (94.6%)
- `unspecified_internal_transfer`: 4 (5.4%)

### SOP Summary

> **WHEN** caller intent is `unknown_or_undetermined`
> **THEN** primary action is `interaction_failed` (86% of cases)
> **EXPECTED RESOLUTION RATE** 14%

---

## Returning Call

**Volume:** 67 calls (13.8% of total)
**Resolution Rate:** 86.6%

### Caller Profile

- `existing_client`: 33 (49.3%)
- `insurance_rep`: 15 (22.4%)
- `new_client`: 7 (10.4%)
- `law_office`: 5 (7.5%)
- `business_vendor`: 3 (4.5%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `transfer_attempted` | 27 | 40.3% |
| `message_taken` | 22 | 32.8% |
| `interaction_failed` | 9 | 13.4% |
| `information_provided` | 7 | 10.4% |
| `callback_scheduled` | 2 | 3.0% |

### Routing Destinations

- `no_transfer`: 40 (59.7%)
- `specific_staff_member`: 24 (35.8%)

### SOP Summary

> **WHEN** caller intent is `returning_call`
> **THEN** primary action is `transfer_attempted` (40% of cases)
> **EXPECTED RESOLUTION RATE** 87%

---

## Check Case Status

**Volume:** 57 calls (11.7% of total)
**Resolution Rate:** 91.2%

### Caller Profile

- `existing_client`: 21 (36.8%)
- `insurance_rep`: 21 (36.8%)
- `medical_provider`: 14 (24.6%)
- `business_vendor`: 1 (1.8%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 24 | 42.1% |
| `transfer_attempted` | 18 | 31.6% |
| `interaction_failed` | 5 | 8.8% |
| `callback_scheduled` | 5 | 8.8% |
| `information_provided` | 5 | 8.8% |

### Routing Destinations

- `no_transfer`: 39 (68.4%)
- `specific_staff_member`: 8 (14.0%)
- `unspecified_internal_transfer`: 5 (8.8%)
- `case_management`: 3 (5.3%)

### SOP Summary

> **WHEN** caller intent is `check_case_status`
> **THEN** primary action is `message_taken` (42% of cases)
> **EXPECTED RESOLUTION RATE** 91%

---

## New Client Intake

**Volume:** 45 calls (9.3% of total)
**Resolution Rate:** 95.6%

### Caller Profile

- `new_client`: 33 (73.3%)
- `family_member`: 5 (11.1%)
- `law_office`: 2 (4.4%)
- `spanish_speaker`: 2 (4.4%)
- `existing_client`: 2 (4.4%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `information_provided` | 23 | 51.1% |
| `transfer_attempted` | 10 | 22.2% |
| `intake_completed` | 5 | 11.1% |
| `message_taken` | 4 | 8.9% |
| `interaction_failed` | 2 | 4.4% |
| `callback_scheduled` | 1 | 2.2% |

### Routing Destinations

- `no_transfer`: 35 (77.8%)
- `legal_counsel`: 4 (8.9%)
- `intake_and_investigation`: 3 (6.7%)

### SOP Summary

> **WHEN** caller intent is `new_client_intake`
> **THEN** primary action is `information_provided` (51% of cases)
> **EXPECTED RESOLUTION RATE** 96%

---

## Administrative Request

**Volume:** 35 calls (7.2% of total)
**Resolution Rate:** 94.3%

### Caller Profile

- `medical_provider`: 10 (28.6%)
- `business_vendor`: 10 (28.6%)
- `insurance_rep`: 6 (17.1%)
- `existing_client`: 4 (11.4%)
- `law_office`: 3 (8.6%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 15 | 42.9% |
| `information_provided` | 14 | 40.0% |
| `transfer_attempted` | 4 | 11.4% |
| `interaction_failed` | 2 | 5.7% |

### Routing Destinations

- `no_transfer`: 31 (88.6%)

### SOP Summary

> **WHEN** caller intent is `administrative_request`
> **THEN** primary action is `message_taken` (43% of cases)
> **EXPECTED RESOLUTION RATE** 94%

---

## Solicitation And Spam

**Volume:** 30 calls (6.2% of total)
**Resolution Rate:** 26.7%

### Caller Profile

- `sales_vendor`: 29 (96.7%)
- `business_vendor`: 1 (3.3%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `interaction_failed` | 22 | 73.3% |
| `message_taken` | 5 | 16.7% |
| `information_provided` | 3 | 10.0% |

### Routing Destinations

- `no_transfer`: 30 (100.0%)

### SOP Summary

> **WHEN** caller intent is `solicitation_and_spam`
> **THEN** primary action is `interaction_failed` (73% of cases)
> **EXPECTED RESOLUTION RATE** 27%

---

## Financial And Settlement Inquiry

**Volume:** 26 calls (5.3% of total)
**Resolution Rate:** 92.3%

### Caller Profile

- `insurance_rep`: 16 (61.5%)
- `existing_client`: 7 (26.9%)
- `medical_provider`: 2 (7.7%)
- `new_client`: 1 (3.8%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 12 | 46.2% |
| `transfer_attempted` | 9 | 34.6% |
| `information_provided` | 2 | 7.7% |
| `callback_scheduled` | 1 | 3.8% |
| `unresolved_staff_unavailable` | 1 | 3.8% |
| `interaction_failed` | 1 | 3.8% |

### Routing Destinations

- `no_transfer`: 17 (65.4%)
- `legal_counsel`: 6 (23.1%)

### SOP Summary

> **WHEN** caller intent is `financial_and_settlement_inquiry`
> **THEN** primary action is `message_taken` (46% of cases)
> **EXPECTED RESOLUTION RATE** 92%

---

## Legal Operations Discussion

**Volume:** 15 calls (3.1% of total)
**Resolution Rate:** 100.0%

### Caller Profile

- `law_office`: 5 (33.3%)
- `business_vendor`: 5 (33.3%)
- `existing_client`: 2 (13.3%)
- `sales_vendor`: 1 (6.7%)
- `medical_provider`: 1 (6.7%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `information_provided` | 9 | 60.0% |
| `message_taken` | 3 | 20.0% |
| `transfer_attempted` | 3 | 20.0% |

### Routing Destinations

- `no_transfer`: 12 (80.0%)

### SOP Summary

> **WHEN** caller intent is `legal_operations_discussion`
> **THEN** primary action is `information_provided` (60% of cases)
> **EXPECTED RESOLUTION RATE** 100%

---

## Document And Evidence Submission

**Volume:** 8 calls (1.6% of total)
**Resolution Rate:** 75.0%

### Caller Profile

- `medical_provider`: 3 (37.5%)
- `new_client`: 2 (25.0%)
- `insurance_rep`: 2 (25.0%)
- `existing_client`: 1 (12.5%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `interaction_failed` | 2 | 25.0% |
| `information_provided` | 2 | 25.0% |
| `message_taken` | 2 | 25.0% |
| `transfer_attempted` | 2 | 25.0% |

### Routing Destinations

- `no_transfer`: 6 (75.0%)

### SOP Summary

> **WHEN** caller intent is `document_and_evidence_submission`
> **THEN** primary action is `interaction_failed` (25% of cases)
> **EXPECTED RESOLUTION RATE** 75%

---

## Scheduling And Appointments

**Volume:** 7 calls (1.4% of total)
**Resolution Rate:** 85.7%

### Caller Profile

- `existing_client`: 5 (71.4%)
- `sales_vendor`: 1 (14.3%)
- `business_vendor`: 1 (14.3%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 3 | 42.9% |
| `transfer_attempted` | 2 | 28.6% |
| `unresolved_staff_unavailable` | 1 | 14.3% |
| `information_provided` | 1 | 14.3% |

### Routing Destinations

- `no_transfer`: 5 (71.4%)

### SOP Summary

> **WHEN** caller intent is `scheduling_and_appointments`
> **THEN** primary action is `message_taken` (43% of cases)
> **EXPECTED RESOLUTION RATE** 86%

---

## Verify Representation

**Volume:** 6 calls (1.2% of total)
**Resolution Rate:** 100.0%

### Caller Profile

- `insurance_rep`: 3 (50.0%)
- `medical_provider`: 3 (50.0%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 3 | 50.0% |
| `information_provided` | 2 | 33.3% |
| `transfer_attempted` | 1 | 16.7% |

### Routing Destinations

- `no_transfer`: 5 (83.3%)

### SOP Summary

> **WHEN** caller intent is `verify_representation`
> **THEN** primary action is `message_taken` (50% of cases)
> **EXPECTED RESOLUTION RATE** 100%

---
