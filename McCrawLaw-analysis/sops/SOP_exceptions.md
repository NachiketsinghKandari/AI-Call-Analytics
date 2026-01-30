# Exception & Failure Analysis Report

*Generated: 2026-01-30 07:22*
*Based on 486 analyzed calls*

---

## Executive Summary

| Metric | Count | % of Total |
|--------|-------|------------|
| Total Calls | 486 | 100% |
| Unresolved Calls | 115 | 23.7% |
| Failed Transfers (no fallback) | 3 | 0.6% |
| Premature Termination | 112 | 23.0% |

## Unresolved Calls Analysis

### By Caller Type

- `new_client`: 60 unresolved (57.7% failure rate)
- `sales_vendor`: 22 unresolved (71.0% failure rate)
- `existing_client`: 11 unresolved (8.9% failure rate)
- `medical_provider`: 6 unresolved (14.3% failure rate)
- `insurance_rep`: 6 unresolved (6.2% failure rate)
- `business_vendor`: 4 unresolved (11.4% failure rate)
- `law_office`: 4 unresolved (12.9% failure rate)
- `spanish_speaker`: 2 unresolved (13.3% failure rate)

### By Intent

- `unknown_or_undetermined`: 64 unresolved (86.5% failure rate)
- `solicitation_and_spam`: 22 unresolved (73.3% failure rate)
- `returning_call`: 9 unresolved (13.4% failure rate)
- `speak_with_staff`: 6 unresolved (5.2% failure rate)
- `check_case_status`: 5 unresolved (8.8% failure rate)
- `document_and_evidence_submission`: 2 unresolved (25.0% failure rate)
- `administrative_request`: 2 unresolved (5.7% failure rate)
- `new_client_intake`: 2 unresolved (4.4% failure rate)
- `financial_and_settlement_inquiry`: 2 unresolved (7.7% failure rate)
- `scheduling_and_appointments`: 1 unresolved (14.3% failure rate)

### By Terminal State

- `call_terminated_prematurely`: 112
- `transfer_failed_no_fallback`: 3

## High-Risk Patterns

*Caller type + intent combinations with above-average failure rates*

| Pattern | Total | Failed | Failure Rate |
|---------|-------|--------|--------------|
| new_client + unknown_or_undetermined | 59 | 57 | 96.6% |
| sales_vendor + solicitation_and_spam | 29 | 22 | 75.9% |
| medical_provider + document_and_evidence_submission | 3 | 2 | 66.7% |
| business_vendor + unknown_or_undetermined | 4 | 2 | 50.0% |
| law_office + returning_call | 5 | 2 | 40.0% |
| business_vendor + returning_call | 3 | 1 | 33.3% |
| spanish_speaker + unknown_or_undetermined | 8 | 2 | 25.0% |

## Fallback Effectiveness

### Secondary Actions Taken

- `message_taken`: 111 cases
- `callback_scheduled`: 19 cases
- `next_steps_documented`: 3 cases
- `None`: 1 cases

*Fallback success: 134 calls saved via secondary actions*

## Recommendations

### Priority Areas for SOP Improvement

1. **new_client + unknown_or_undetermined** - 97% failure rate (57/59 calls)
   - Consider adding specific handling instructions for this combination

2. **sales_vendor + solicitation_and_spam** - 76% failure rate (22/29 calls)
   - Consider adding specific handling instructions for this combination

3. **medical_provider + document_and_evidence_submission** - 67% failure rate (2/3 calls)
   - Consider adding specific handling instructions for this combination

### Transfer Failure Mitigation

- 3 calls had transfer failures with no fallback
- Consider implementing mandatory fallback protocols (message taking, callback scheduling)
