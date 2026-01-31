# Standard Operating Procedures by Intent

*Generated: 2026-01-31 13:40*
*Based on 486 analyzed calls*

---

## Speak With Staff

**Volume:** 111 calls (22.8% of total)
**Resolution Rate:** 95.5%

### Caller Profile

- `existing_client`: 47 (42.3%)
- `insurance_rep`: 25 (22.5%)
- `law_office`: 15 (13.5%)
- `business_vendor`: 10 (9.0%)
- `medical_provider`: 8 (7.2%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `transfer_attempted` | 65 | 58.6% |
| `message_taken` | 31 | 27.9% |
| `information_provided` | 6 | 5.4% |
| `interaction_failed` | 4 | 3.6% |
| `callback_scheduled` | 4 | 3.6% |
| `unresolved_staff_unavailable` | 1 | 0.9% |

### Routing Destinations

- `specific_staff_member`: 47 (42.3%)
- `no_transfer`: 46 (41.4%)
- `legal_counsel`: 8 (7.2%)
- `unspecified_internal_transfer`: 6 (5.4%)
- `case_management`: 4 (3.6%)

### SOP Summary

> **WHEN** caller intent is `speak_with_staff`
> **THEN** primary action is `transfer_attempted` (59% of cases)
> **ROUTE TO** `specific_staff_member` (42% of cases)
> **EXPECTED RESOLUTION RATE** 95%

---

## Unknown Or Undetermined

**Volume:** 71 calls (14.6% of total)
**Resolution Rate:** 8.5%

### Caller Profile

- `new_client`: 61 (85.9%)
- `spanish_speaker`: 5 (7.0%)
- `existing_client`: 3 (4.2%)
- `medical_provider`: 1 (1.4%)
- `business_vendor`: 1 (1.4%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `interaction_failed` | 65 | 91.5% |
| `information_provided` | 3 | 4.2% |
| `transfer_attempted` | 2 | 2.8% |
| `callback_scheduled` | 1 | 1.4% |

### Routing Destinations

- `no_transfer`: 69 (97.2%)

### SOP Summary

> **WHEN** caller intent is `unknown_or_undetermined`
> **THEN** primary action is `interaction_failed` (92% of cases)
> **EXPECTED RESOLUTION RATE** 8%

---

## Check Case Status

**Volume:** 67 calls (13.8% of total)
**Resolution Rate:** 91.0%

### Caller Profile

- `insurance_rep`: 27 (40.3%)
- `existing_client`: 24 (35.8%)
- `medical_provider`: 15 (22.4%)
- `spanish_speaker`: 1 (1.5%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 34 | 50.7% |
| `transfer_attempted` | 19 | 28.4% |
| `interaction_failed` | 6 | 9.0% |
| `information_provided` | 5 | 7.5% |
| `callback_scheduled` | 3 | 4.5% |

### Routing Destinations

- `no_transfer`: 48 (71.6%)
- `specific_staff_member`: 6 (9.0%)
- `unspecified_internal_transfer`: 5 (7.5%)
- `case_management`: 5 (7.5%)
- `legal_counsel`: 3 (4.5%)

### SOP Summary

> **WHEN** caller intent is `check_case_status`
> **THEN** primary action is `message_taken` (51% of cases)
> **EXPECTED RESOLUTION RATE** 91%

---

## Returning Call

**Volume:** 61 calls (12.6% of total)
**Resolution Rate:** 86.9%

### Caller Profile

- `existing_client`: 30 (49.2%)
- `insurance_rep`: 15 (24.6%)
- `new_client`: 6 (9.8%)
- `law_office`: 3 (4.9%)
- `medical_provider`: 2 (3.3%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 24 | 39.3% |
| `transfer_attempted` | 22 | 36.1% |
| `interaction_failed` | 8 | 13.1% |
| `information_provided` | 5 | 8.2% |
| `callback_scheduled` | 2 | 3.3% |

### Routing Destinations

- `no_transfer`: 39 (63.9%)
- `specific_staff_member`: 17 (27.9%)
- `unspecified_internal_transfer`: 4 (6.6%)

### SOP Summary

> **WHEN** caller intent is `returning_call`
> **THEN** primary action is `message_taken` (39% of cases)
> **EXPECTED RESOLUTION RATE** 87%

---

## New Client Intake

**Volume:** 44 calls (9.1% of total)
**Resolution Rate:** 97.7%

### Caller Profile

- `new_client`: 34 (77.3%)
- `family_member`: 4 (9.1%)
- `law_office`: 2 (4.5%)
- `spanish_speaker`: 2 (4.5%)
- `insurance_rep`: 1 (2.3%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `information_provided` | 21 | 47.7% |
| `transfer_attempted` | 11 | 25.0% |
| `intake_completed` | 7 | 15.9% |
| `message_taken` | 3 | 6.8% |
| `interaction_failed` | 1 | 2.3% |
| `callback_scheduled` | 1 | 2.3% |

### Routing Destinations

- `no_transfer`: 33 (75.0%)
- `legal_counsel`: 5 (11.4%)
- `intake_and_investigation`: 3 (6.8%)

### SOP Summary

> **WHEN** caller intent is `new_client_intake`
> **THEN** primary action is `information_provided` (48% of cases)
> **EXPECTED RESOLUTION RATE** 98%

---

## Administrative Request

**Volume:** 37 calls (7.6% of total)
**Resolution Rate:** 100.0%

### Caller Profile

- `business_vendor`: 13 (35.1%)
- `medical_provider`: 10 (27.0%)
- `existing_client`: 4 (10.8%)
- `law_office`: 3 (8.1%)
- `insurance_rep`: 3 (8.1%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `information_provided` | 18 | 48.6% |
| `message_taken` | 15 | 40.5% |
| `transfer_attempted` | 4 | 10.8% |

### Routing Destinations

- `no_transfer`: 33 (89.2%)

### SOP Summary

> **WHEN** caller intent is `administrative_request`
> **THEN** primary action is `information_provided` (49% of cases)
> **EXPECTED RESOLUTION RATE** 100%

---

## Solicitation And Spam

**Volume:** 31 calls (6.4% of total)
**Resolution Rate:** 29.0%

### Caller Profile

- `sales_vendor`: 28 (90.3%)
- `business_vendor`: 3 (9.7%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `interaction_failed` | 22 | 71.0% |
| `message_taken` | 4 | 12.9% |
| `information_provided` | 3 | 9.7% |
| `transfer_attempted` | 1 | 3.2% |
| `callback_scheduled` | 1 | 3.2% |

### Routing Destinations

- `no_transfer`: 30 (96.8%)

### SOP Summary

> **WHEN** caller intent is `solicitation_and_spam`
> **THEN** primary action is `interaction_failed` (71% of cases)
> **EXPECTED RESOLUTION RATE** 29%

---

## Financial And Settlement Inquiry

**Volume:** 30 calls (6.2% of total)
**Resolution Rate:** 93.3%

### Caller Profile

- `insurance_rep`: 18 (60.0%)
- `existing_client`: 8 (26.7%)
- `medical_provider`: 2 (6.7%)
- `law_office`: 1 (3.3%)
- `new_client`: 1 (3.3%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 15 | 50.0% |
| `transfer_attempted` | 10 | 33.3% |
| `interaction_failed` | 2 | 6.7% |
| `information_provided` | 2 | 6.7% |
| `callback_scheduled` | 1 | 3.3% |

### Routing Destinations

- `no_transfer`: 20 (66.7%)
- `legal_counsel`: 5 (16.7%)

### SOP Summary

> **WHEN** caller intent is `financial_and_settlement_inquiry`
> **THEN** primary action is `message_taken` (50% of cases)
> **EXPECTED RESOLUTION RATE** 93%

---

## Legal Operations Discussion

**Volume:** 15 calls (3.1% of total)
**Resolution Rate:** 100.0%

### Caller Profile

- `law_office`: 9 (60.0%)
- `insurance_rep`: 3 (20.0%)
- `existing_client`: 2 (13.3%)
- `business_vendor`: 1 (6.7%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `information_provided` | 8 | 53.3% |
| `message_taken` | 3 | 20.0% |
| `transfer_attempted` | 2 | 13.3% |
| `callback_scheduled` | 1 | 6.7% |
| `pending_action` | 1 | 6.7% |

### Routing Destinations

- `no_transfer`: 13 (86.7%)

### SOP Summary

> **WHEN** caller intent is `legal_operations_discussion`
> **THEN** primary action is `information_provided` (53% of cases)
> **EXPECTED RESOLUTION RATE** 100%

---

## Scheduling And Appointments

**Volume:** 7 calls (1.4% of total)
**Resolution Rate:** 85.7%

### Caller Profile

- `existing_client`: 5 (71.4%)
- `business_vendor`: 2 (28.6%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `message_taken` | 3 | 42.9% |
| `transfer_attempted` | 2 | 28.6% |
| `unresolved_staff_unavailable` | 1 | 14.3% |
| `callback_scheduled` | 1 | 14.3% |

### Routing Destinations

- `no_transfer`: 5 (71.4%)

### SOP Summary

> **WHEN** caller intent is `scheduling_and_appointments`
> **THEN** primary action is `message_taken` (43% of cases)
> **EXPECTED RESOLUTION RATE** 86%

---

## Document And Evidence Submission

**Volume:** 6 calls (1.2% of total)
**Resolution Rate:** 66.7%

### Caller Profile

- `medical_provider`: 2 (33.3%)
- `existing_client`: 2 (33.3%)
- `insurance_rep`: 2 (33.3%)

### Resolution Pattern

| Resolution Type | Count | % |
|----------------|-------|---|
| `information_provided` | 3 | 50.0% |
| `message_taken` | 2 | 33.3% |
| `interaction_failed` | 1 | 16.7% |

### Routing Destinations

- `no_transfer`: 6 (100.0%)

### SOP Summary

> **WHEN** caller intent is `document_and_evidence_submission`
> **THEN** primary action is `information_provided` (50% of cases)
> **EXPECTED RESOLUTION RATE** 67%

---

## Verify Representation

**Volume:** 6 calls (1.2% of total)
**Resolution Rate:** 100.0%

### Caller Profile

- `medical_provider`: 3 (50.0%)
- `insurance_rep`: 3 (50.0%)

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
