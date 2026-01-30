# Standard Operating Procedures by Caller Type

*Generated: 2026-01-30 07:22*
*Based on 486 analyzed calls*

---

## Existing Client

**Volume:** 123 calls (25.3% of total)
**Resolution Rate:** 91.1%

### Common Intents

- `speak_with_staff`: 46 (37.4%)
- `returning_call`: 33 (26.8%)
- `check_case_status`: 21 (17.1%)
- `financial_and_settlement_inquiry`: 7 (5.7%)
- `scheduling_and_appointments`: 5 (4.1%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 62 | 50.4% | Handle directly (no transfer) |
| `specific_staff_member` | 48 | 39.0% | Transfer to specific staff member |
| `legal_counsel` | 5 | 4.1% | Transfer to legal counsel |
| `unspecified_internal_transfer` | 5 | 4.1% | Transfer to unspecified internal transfer |

### Outcome Distribution

- ⚠️ `transfer_failed_fallback_accepted`: 55 (44.7%)
- ✅ `entered_transfer_path`: 30 (24.4%)
- ✅ `direct_resolution`: 27 (22.0%)
- ❌ `call_terminated_prematurely`: 10 (8.1%)
- ⚠️ `transfer_failed_no_fallback`: 1 (0.8%)

### Fallback Handling

- When transfer fails: `message_taken` (45 cases)
- When transfer fails: `callback_scheduled` (9 cases)
- When transfer fails: `next_steps_documented` (1 cases)

---

## New Client

**Volume:** 104 calls (21.4% of total)
**Resolution Rate:** 42.3%

### Common Intents

- `unknown_or_undetermined`: 59 (56.7%)
- `new_client_intake`: 33 (31.7%)
- `returning_call`: 7 (6.7%)
- `document_and_evidence_submission`: 2 (1.9%)
- `administrative_request`: 1 (1.0%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 94 | 90.4% | Handle directly (no transfer) |
| `legal_counsel` | 4 | 3.8% | Transfer to legal counsel |
| `intake_and_investigation` | 3 | 2.9% | Transfer to intake and investigation |

### Outcome Distribution

- ❌ `call_terminated_prematurely`: 59 (56.7%)
- ✅ `direct_resolution`: 33 (31.7%)
- ✅ `entered_transfer_path`: 7 (6.7%)
- ⚠️ `transfer_failed_fallback_accepted`: 4 (3.8%)
- ⚠️ `transfer_failed_no_fallback`: 1 (1.0%)

### Fallback Handling

- When transfer fails: `next_steps_documented` (3 cases)
- When transfer fails: `message_taken` (2 cases)
- When transfer fails: `callback_scheduled` (1 cases)

---

## Insurance Rep

**Volume:** 96 calls (19.8% of total)
**Resolution Rate:** 93.8%

### Common Intents

- `speak_with_staff`: 31 (32.3%)
- `check_case_status`: 21 (21.9%)
- `financial_and_settlement_inquiry`: 16 (16.7%)
- `returning_call`: 15 (15.6%)
- `administrative_request`: 6 (6.2%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 59 | 61.5% | Handle directly (no transfer) |
| `specific_staff_member` | 18 | 18.8% | Transfer to specific staff member |
| `legal_counsel` | 11 | 11.5% | Transfer to legal counsel |
| `unspecified_internal_transfer` | 6 | 6.2% | Transfer to unspecified internal transfer |

### Outcome Distribution

- ⚠️ `transfer_failed_fallback_accepted`: 41 (42.7%)
- ✅ `direct_resolution`: 35 (36.5%)
- ✅ `entered_transfer_path`: 14 (14.6%)
- ❌ `call_terminated_prematurely`: 6 (6.2%)

### Fallback Handling

- When transfer fails: `message_taken` (36 cases)
- When transfer fails: `callback_scheduled` (6 cases)

---

## Medical Provider

**Volume:** 42 calls (8.6% of total)
**Resolution Rate:** 85.7%

### Common Intents

- `check_case_status`: 14 (33.3%)
- `administrative_request`: 10 (23.8%)
- `speak_with_staff`: 7 (16.7%)
- `document_and_evidence_submission`: 3 (7.1%)
- `verify_representation`: 3 (7.1%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 30 | 71.4% | Handle directly (no transfer) |
| `unspecified_internal_transfer` | 5 | 11.9% | Transfer to unspecified internal transfer |
| `specific_staff_member` | 4 | 9.5% | Transfer to specific staff member |

### Outcome Distribution

- ✅ `direct_resolution`: 20 (47.6%)
- ⚠️ `transfer_failed_fallback_accepted`: 11 (26.2%)
- ❌ `call_terminated_prematurely`: 6 (14.3%)
- ✅ `entered_transfer_path`: 5 (11.9%)

### Fallback Handling

- When transfer fails: `message_taken` (9 cases)
- When transfer fails: `callback_scheduled` (1 cases)

---

## Business Vendor

**Volume:** 35 calls (7.2% of total)
**Resolution Rate:** 88.6%

### Common Intents

- `speak_with_staff`: 10 (28.6%)
- `administrative_request`: 10 (28.6%)
- `legal_operations_discussion`: 5 (14.3%)
- `unknown_or_undetermined`: 4 (11.4%)
- `returning_call`: 3 (8.6%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 28 | 80.0% | Handle directly (no transfer) |
| `specific_staff_member` | 4 | 11.4% | Transfer to specific staff member |

### Outcome Distribution

- ✅ `direct_resolution`: 21 (60.0%)
- ⚠️ `transfer_failed_fallback_accepted`: 9 (25.7%)
- ❌ `call_terminated_prematurely`: 4 (11.4%)
- ✅ `entered_transfer_path`: 1 (2.9%)

### Fallback Handling

- When transfer fails: `message_taken` (8 cases)
- When transfer fails: `callback_scheduled` (1 cases)
- When transfer fails: `next_steps_documented` (1 cases)

---

## Sales Vendor

**Volume:** 31 calls (6.4% of total)
**Resolution Rate:** 29.0%

### Common Intents

- `solicitation_and_spam`: 29 (93.5%)
- `legal_operations_discussion`: 1 (3.2%)
- `scheduling_and_appointments`: 1 (3.2%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 31 | 100.0% | Handle directly (no transfer) |

### Outcome Distribution

- ❌ `call_terminated_prematurely`: 22 (71.0%)
- ✅ `direct_resolution`: 8 (25.8%)
- ⚠️ `transfer_failed_fallback_accepted`: 1 (3.2%)

### Fallback Handling

- When transfer fails: `message_taken` (1 cases)

---

## Law Office

**Volume:** 31 calls (6.4% of total)
**Resolution Rate:** 87.1%

### Common Intents

- `speak_with_staff`: 16 (51.6%)
- `returning_call`: 5 (16.1%)
- `legal_operations_discussion`: 5 (16.1%)
- `administrative_request`: 3 (9.7%)
- `new_client_intake`: 2 (6.5%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 17 | 54.8% | Handle directly (no transfer) |
| `specific_staff_member` | 11 | 35.5% | Transfer to specific staff member |
| `legal_counsel` | 3 | 9.7% | Transfer to legal counsel |

### Outcome Distribution

- ✅ `direct_resolution`: 12 (38.7%)
- ⚠️ `transfer_failed_fallback_accepted`: 8 (25.8%)
- ✅ `entered_transfer_path`: 7 (22.6%)
- ❌ `call_terminated_prematurely`: 3 (9.7%)
- ⚠️ `transfer_failed_no_fallback`: 1 (3.2%)

### Fallback Handling

- When transfer fails: `message_taken` (8 cases)

---

## Spanish Speaker

**Volume:** 15 calls (3.1% of total)
**Resolution Rate:** 86.7%

### Common Intents

- `unknown_or_undetermined`: 8 (53.3%)
- `speak_with_staff`: 3 (20.0%)
- `new_client_intake`: 2 (13.3%)
- `returning_call`: 1 (6.7%)
- `administrative_request`: 1 (6.7%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 9 | 60.0% | Handle directly (no transfer) |
| `unspecified_internal_transfer` | 4 | 26.7% | Transfer to unspecified internal transfer |

### Outcome Distribution

- ✅ `direct_resolution`: 7 (46.7%)
- ✅ `entered_transfer_path`: 5 (33.3%)
- ❌ `call_terminated_prematurely`: 2 (13.3%)
- ⚠️ `transfer_failed_fallback_accepted`: 1 (6.7%)

### Fallback Handling

- When transfer fails: `callback_scheduled` (1 cases)
- When transfer fails: `message_taken` (1 cases)

---

## Family Member

**Volume:** 9 calls (1.9% of total)
**Resolution Rate:** 100.0%

### Common Intents

- `new_client_intake`: 5 (55.6%)
- `speak_with_staff`: 2 (22.2%)
- `returning_call`: 2 (22.2%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 7 | 77.8% | Handle directly (no transfer) |

### Outcome Distribution

- ✅ `direct_resolution`: 5 (55.6%)
- ⚠️ `transfer_failed_fallback_accepted`: 4 (44.4%)

### Fallback Handling

- When transfer fails: `message_taken` (2 cases)
- When transfer fails: `callback_scheduled` (2 cases)

---
