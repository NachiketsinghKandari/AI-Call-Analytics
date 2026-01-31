# Exception & Failure Analysis Report

*Generated: 2026-01-31 13:40*
*Based on 486 analyzed calls*

---

## Executive Summary

| Metric | Count | % of Total |
|--------|-------|------------|
| Total Calls | 486 | 100% |
| Unresolved Calls | 112 | 23.0% |
| Failed Transfers (no fallback) | 2 | 0.4% |
| Premature Termination | 110 | 22.6% |

## Unresolved Calls Analysis

### By Caller Type

- `new_client`: 60 unresolved (57.7% failure rate)
- `sales_vendor`: 21 unresolved (72.4% failure rate)
- `existing_client`: 12 unresolved (9.5% failure rate)
- `medical_provider`: 6 unresolved (14.0% failure rate)
- `insurance_rep`: 5 unresolved (5.2% failure rate)
- `law_office`: 3 unresolved (9.1% failure rate)
- `business_vendor`: 3 unresolved (9.4% failure rate)
- `spanish_speaker`: 2 unresolved (14.3% failure rate)

### By Intent

- `unknown_or_undetermined`: 65 unresolved (91.5% failure rate)
- `solicitation_and_spam`: 22 unresolved (71.0% failure rate)
- `returning_call`: 8 unresolved (13.1% failure rate)
- `check_case_status`: 6 unresolved (9.0% failure rate)
- `speak_with_staff`: 5 unresolved (4.5% failure rate)
- `document_and_evidence_submission`: 2 unresolved (33.3% failure rate)
- `financial_and_settlement_inquiry`: 2 unresolved (6.7% failure rate)
- `new_client_intake`: 1 unresolved (2.3% failure rate)
- `scheduling_and_appointments`: 1 unresolved (14.3% failure rate)

### By Terminal State

- `call_terminated_prematurely`: 110
- `transfer_failed_no_fallback`: 2

## High-Risk Patterns

*Caller type + intent combinations with above-average failure rates*

| Pattern | Total | Failed | Failure Rate |
|---------|-------|--------|--------------|
| new_client + unknown_or_undetermined | 61 | 59 | 96.7% |
| sales_vendor + solicitation_and_spam | 28 | 21 | 75.0% |
| existing_client + unknown_or_undetermined | 3 | 2 | 66.7% |
| law_office + returning_call | 3 | 2 | 66.7% |
| spanish_speaker + unknown_or_undetermined | 5 | 2 | 40.0% |
| business_vendor + solicitation_and_spam | 3 | 1 | 33.3% |

## Fallback Effectiveness

### Secondary Actions Taken

- `message_taken`: 103 cases
- `callback_scheduled`: 12 cases
- `next_steps_documented`: 3 cases

*Fallback success: 118 calls saved via secondary actions*

## Recommendations

### Priority Areas for SOP Improvement

1. **new_client + unknown_or_undetermined** - 97% failure rate (59/61 calls)
   - Consider adding specific handling instructions for this combination

2. **sales_vendor + solicitation_and_spam** - 75% failure rate (21/28 calls)
   - Consider adding specific handling instructions for this combination

3. **existing_client + unknown_or_undetermined** - 67% failure rate (2/3 calls)
   - Consider adding specific handling instructions for this combination

### Transfer Failure Mitigation

- 2 calls had transfer failures with no fallback
- Consider implementing mandatory fallback protocols (message taking, callback scheduling)
