# Standard Operating Procedures by Caller Type

*Generated: 2026-01-31 13:40*
*Based on 486 analyzed calls*

---

## Existing Client

**Volume:** 126 calls (25.9% of total)
**Resolution Rate:** 90.5%

### Common Intents

- `speak_with_staff`: 47 (37.3%)
- `returning_call`: 30 (23.8%)
- `check_case_status`: 24 (19.0%)
- `financial_and_settlement_inquiry`: 8 (6.3%)
- `scheduling_and_appointments`: 5 (4.0%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 64 | 50.8% | Handle directly (no transfer) |
| `specific_staff_member` | 43 | 34.1% | Transfer to specific staff member |
| `unspecified_internal_transfer` | 8 | 6.3% | Transfer to unspecified internal transfer |
| `case_management` | 6 | 4.8% | Transfer to case management |
| `legal_counsel` | 4 | 3.2% | Transfer to legal counsel |

### Outcome Distribution

- ⚠️ `transfer_failed_fallback_accepted`: 46 (36.5%)
- ✅ `direct_resolution`: 39 (31.0%)
- ✅ `entered_transfer_path`: 29 (23.0%)
- ❌ `call_terminated_prematurely`: 10 (7.9%)
- ⚠️ `transfer_failed_no_fallback`: 2 (1.6%)

### Fallback Handling

- When transfer fails: `message_taken` (42 cases)
- When transfer fails: `callback_scheduled` (4 cases)

---

## New Client

**Volume:** 104 calls (21.4% of total)
**Resolution Rate:** 42.3%

### Common Intents

- `unknown_or_undetermined`: 61 (58.7%)
- `new_client_intake`: 34 (32.7%)
- `returning_call`: 6 (5.8%)
- `administrative_request`: 1 (1.0%)
- `speak_with_staff`: 1 (1.0%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 93 | 89.4% | Handle directly (no transfer) |
| `legal_counsel` | 5 | 4.8% | Transfer to legal counsel |
| `intake_and_investigation` | 3 | 2.9% | Transfer to intake and investigation |

### Outcome Distribution

- ❌ `call_terminated_prematurely`: 60 (57.7%)
- ✅ `direct_resolution`: 33 (31.7%)
- ✅ `entered_transfer_path`: 7 (6.7%)
- ⚠️ `transfer_failed_fallback_accepted`: 4 (3.8%)

### Fallback Handling

- When transfer fails: `next_steps_documented` (3 cases)
- When transfer fails: `message_taken` (1 cases)

---

## Insurance Rep

**Volume:** 97 calls (20.0% of total)
**Resolution Rate:** 94.8%

### Common Intents

- `check_case_status`: 27 (27.8%)
- `speak_with_staff`: 25 (25.8%)
- `financial_and_settlement_inquiry`: 18 (18.6%)
- `returning_call`: 15 (15.5%)
- `legal_operations_discussion`: 3 (3.1%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 66 | 68.0% | Handle directly (no transfer) |
| `specific_staff_member` | 13 | 13.4% | Transfer to specific staff member |
| `legal_counsel` | 8 | 8.2% | Transfer to legal counsel |
| `unspecified_internal_transfer` | 7 | 7.2% | Transfer to unspecified internal transfer |
| `case_management` | 3 | 3.1% | Transfer to case management |

### Outcome Distribution

- ⚠️ `transfer_failed_fallback_accepted`: 40 (41.2%)
- ✅ `direct_resolution`: 37 (38.1%)
- ✅ `entered_transfer_path`: 15 (15.5%)
- ❌ `call_terminated_prematurely`: 5 (5.2%)

### Fallback Handling

- When transfer fails: `message_taken` (40 cases)
- When transfer fails: `callback_scheduled` (3 cases)

---

## Medical Provider

**Volume:** 43 calls (8.8% of total)
**Resolution Rate:** 86.0%

### Common Intents

- `check_case_status`: 15 (34.9%)
- `administrative_request`: 10 (23.3%)
- `speak_with_staff`: 8 (18.6%)
- `verify_representation`: 3 (7.0%)
- `document_and_evidence_submission`: 2 (4.7%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 33 | 76.7% | Handle directly (no transfer) |
| `specific_staff_member` | 4 | 9.3% | Transfer to specific staff member |
| `unspecified_internal_transfer` | 3 | 7.0% | Transfer to unspecified internal transfer |

### Outcome Distribution

- ✅ `direct_resolution`: 25 (58.1%)
- ⚠️ `transfer_failed_fallback_accepted`: 7 (16.3%)
- ❌ `call_terminated_prematurely`: 6 (14.0%)
- ✅ `entered_transfer_path`: 5 (11.6%)

### Fallback Handling

- When transfer fails: `message_taken` (7 cases)
- When transfer fails: `callback_scheduled` (1 cases)

---

## Law Office

**Volume:** 33 calls (6.8% of total)
**Resolution Rate:** 90.9%

### Common Intents

- `speak_with_staff`: 15 (45.5%)
- `legal_operations_discussion`: 9 (27.3%)
- `administrative_request`: 3 (9.1%)
- `returning_call`: 3 (9.1%)
- `new_client_intake`: 2 (6.1%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 19 | 57.6% | Handle directly (no transfer) |
| `specific_staff_member` | 10 | 30.3% | Transfer to specific staff member |
| `legal_counsel` | 4 | 12.1% | Transfer to legal counsel |

### Outcome Distribution

- ✅ `direct_resolution`: 15 (45.5%)
- ⚠️ `transfer_failed_fallback_accepted`: 8 (24.2%)
- ✅ `entered_transfer_path`: 7 (21.2%)
- ❌ `call_terminated_prematurely`: 3 (9.1%)

### Fallback Handling

- When transfer fails: `message_taken` (6 cases)
- When transfer fails: `callback_scheduled` (2 cases)

---

## Business Vendor

**Volume:** 32 calls (6.6% of total)
**Resolution Rate:** 90.6%

### Common Intents

- `administrative_request`: 13 (40.6%)
- `speak_with_staff`: 10 (31.2%)
- `solicitation_and_spam`: 3 (9.4%)
- `scheduling_and_appointments`: 2 (6.2%)
- `returning_call`: 2 (6.2%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 28 | 87.5% | Handle directly (no transfer) |

### Outcome Distribution

- ✅ `direct_resolution`: 19 (59.4%)
- ⚠️ `transfer_failed_fallback_accepted`: 9 (28.1%)
- ❌ `call_terminated_prematurely`: 3 (9.4%)
- ✅ `entered_transfer_path`: 1 (3.1%)

### Fallback Handling

- When transfer fails: `message_taken` (8 cases)
- When transfer fails: `callback_scheduled` (1 cases)

---

## Sales Vendor

**Volume:** 29 calls (6.0% of total)
**Resolution Rate:** 27.6%

### Common Intents

- `solicitation_and_spam`: 28 (96.6%)
- `administrative_request`: 1 (3.4%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 28 | 96.6% | Handle directly (no transfer) |

### Outcome Distribution

- ❌ `call_terminated_prematurely`: 21 (72.4%)
- ✅ `direct_resolution`: 7 (24.1%)
- ⚠️ `transfer_failed_fallback_accepted`: 1 (3.4%)

### Fallback Handling

- When transfer fails: `message_taken` (1 cases)

---

## Spanish Speaker

**Volume:** 14 calls (2.9% of total)
**Resolution Rate:** 85.7%

### Common Intents

- `unknown_or_undetermined`: 5 (35.7%)
- `speak_with_staff`: 3 (21.4%)
- `new_client_intake`: 2 (14.3%)
- `administrative_request`: 2 (14.3%)
- `returning_call`: 1 (7.1%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 9 | 64.3% | Handle directly (no transfer) |
| `unspecified_internal_transfer` | 4 | 28.6% | Transfer to unspecified internal transfer |

### Outcome Distribution

- ✅ `direct_resolution`: 7 (50.0%)
- ✅ `entered_transfer_path`: 4 (28.6%)
- ❌ `call_terminated_prematurely`: 2 (14.3%)
- ⚠️ `transfer_failed_fallback_accepted`: 1 (7.1%)

### Fallback Handling

- When transfer fails: `message_taken` (1 cases)

---

## Family Member

**Volume:** 8 calls (1.6% of total)
**Resolution Rate:** 100.0%

### Common Intents

- `new_client_intake`: 4 (50.0%)
- `speak_with_staff`: 2 (25.0%)
- `returning_call`: 2 (25.0%)

### Routing SOP

| Destination | Count | % | Action |
|------------|-------|---|--------|
| `no_transfer` | 7 | 87.5% | Handle directly (no transfer) |

### Outcome Distribution

- ✅ `direct_resolution`: 6 (75.0%)
- ⚠️ `transfer_failed_fallback_accepted`: 2 (25.0%)

### Fallback Handling

- When transfer fails: `next_steps_documented` (1 cases)
- When transfer fails: `message_taken` (1 cases)
- When transfer fails: `callback_scheduled` (1 cases)

---
