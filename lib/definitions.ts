/**
 * Call Analysis Field Definitions
 *
 * These definitions explain the controlled vocabularies used in the call analysis system.
 * The system models what the receptionist operationally did, based strictly on spoken evidence.
 */

export interface FieldDefinition {
  value: string;
  label: string;
  description: string;
}

export interface CategoryDefinition {
  name: string;
  description: string;
  fields: FieldDefinition[];
}

export const ACHIEVED_STATUS_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'resolved',
    label: 'Resolved',
    description: 'The receptionist completed a valid operational end-state: transfer path entered, fallback accepted (message taken, callback scheduled), or direct service completed (question answered, info provided, intake finished).',
  },
  {
    value: 'unresolved',
    label: 'Unresolved',
    description: 'The call ended without a completed next step: transfer failed with no fallback accepted, call ended before next steps agreed, or caller gave no contact info for follow-up.',
  },
  {
    value: 'unknown',
    label: 'Unknown',
    description: 'Resolution status could not be determined from the transcript.',
  },
];

export const CALLER_TYPE_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'insurance_rep',
    label: 'Insurance Rep',
    description: 'Representative from an insurance company calling about claims, coverage, or case-related insurance matters.',
  },
  {
    value: 'medical_provider',
    label: 'Medical Provider',
    description: 'Healthcare professional or medical office staff calling about treatment records, liens, or patient-related case information.',
  },
  {
    value: 'new_client',
    label: 'New Client',
    description: 'First-time caller seeking legal representation or inquiring about services for a new matter.',
  },
  {
    value: 'existing_client',
    label: 'Existing Client',
    description: 'Current client with an active case calling for updates, questions, or case-related matters.',
  },
  {
    value: 'family_member',
    label: 'Family Member',
    description: 'Relative of a client calling on their behalf or seeking information about a family member\'s case.',
  },
  {
    value: 'business_vendor',
    label: 'Business Vendor',
    description: 'Supplier or service provider calling about business operations, invoices, or vendor-related matters.',
  },
  {
    value: 'law_office',
    label: 'Law Office',
    description: 'Attorney or staff from another law firm calling about shared cases, referrals, or legal matters.',
  },
  {
    value: 'sales_vendor',
    label: 'Sales Vendor',
    description: 'Sales representative or solicitor calling to offer products or services to the firm.',
  },
  {
    value: 'spanish_speaker',
    label: 'Spanish Speaker',
    description: 'Caller requiring Spanish language support. This classification takes priority over other caller types.',
  },
  {
    value: 'unknown',
    label: 'Unknown',
    description: 'Caller type could not be determined from the transcript.',
  },
];

export const PRIMARY_INTENT_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'speak_with_staff',
    label: 'Speak with Staff',
    description: 'Caller wants to speak directly with a specific staff member, attorney, or department.',
  },
  {
    value: 'financial_and_settlement_inquiry',
    label: 'Financial & Settlement',
    description: 'Questions about settlement status, payment schedules, disbursements, or financial aspects of a case.',
  },
  {
    value: 'check_case_status',
    label: 'Check Case Status',
    description: 'Caller seeking updates on their case progress, next steps, or current status.',
  },
  {
    value: 'legal_operations_discussion',
    label: 'Legal Operations',
    description: 'Discussion about legal strategy, court proceedings, or substantive case matters.',
  },
  {
    value: 'document_and_evidence_submission',
    label: 'Document Submission',
    description: 'Caller wants to submit, discuss, or inquire about documents or evidence for their case.',
  },
  {
    value: 'administrative_request',
    label: 'Administrative Request',
    description: 'General administrative matters like address changes, contact updates, or office information.',
  },
  {
    value: 'new_client_intake',
    label: 'New Client Intake',
    description: 'New potential client calling to discuss their situation and potentially retain the firm.',
  },
  {
    value: 'verify_representation',
    label: 'Verify Representation',
    description: 'Third party verifying whether the firm represents a particular individual.',
  },
  {
    value: 'unknown_or_undetermined',
    label: 'Unknown',
    description: 'Primary intent could not be determined from the transcript.',
  },
  {
    value: 'solicitation_and_spam',
    label: 'Solicitation & Spam',
    description: 'Unsolicited sales calls, spam, or non-business-related communications.',
  },
  {
    value: 'scheduling_and_appointments',
    label: 'Scheduling',
    description: 'Caller wants to schedule, reschedule, or cancel appointments or meetings.',
  },
  {
    value: 'returning_call',
    label: 'Returning Call',
    description: 'Caller is returning a missed call or responding to a voicemail from the firm.',
  },
];

export const RESOLUTION_TYPE_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'transfer_attempted',
    label: 'Transfer Attempted',
    description: 'Receptionist attempted to transfer the call to another party. This is set whenever transfer destinations are recorded.',
  },
  {
    value: 'information_provided',
    label: 'Information Provided',
    description: 'Caller\'s question was answered directly without needing a transfer or callback.',
  },
  {
    value: 'callback_scheduled',
    label: 'Callback Scheduled',
    description: 'A callback was arranged for a later time with appropriate contact information collected.',
  },
  {
    value: 'message_taken',
    label: 'Message Taken',
    description: 'Receptionist took a message to be delivered to the appropriate party.',
  },
  {
    value: 'intake_completed',
    label: 'Intake Completed',
    description: 'New client intake process was completed during the call.',
  },
  {
    value: 'pending_action',
    label: 'Pending Action',
    description: 'Action is pending - caller needs to provide more information or wait for follow-up.',
  },
  {
    value: 'interaction_failed',
    label: 'Interaction Failed',
    description: 'The interaction did not result in any productive outcome.',
  },
  {
    value: 'unresolved_staff_unavailable',
    label: 'Unresolved - Staff Unavailable',
    description: 'Call could not be resolved because required staff was unavailable and no fallback was accepted.',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Resolution type does not fit into standard categories.',
  },
  {
    value: 'no_resolution_type',
    label: 'No Resolution Type',
    description: 'Resolution type was not determined or recorded.',
  },
];

export const TRANSFER_DESTINATION_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'case_management',
    label: 'Case Management',
    description: 'Transfer to case management team for case-related inquiries and updates.',
  },
  {
    value: 'case_management_voicemail',
    label: 'Case Management VM',
    description: 'Transfer to case management voicemail when staff is unavailable.',
  },
  {
    value: 'legal_counsel',
    label: 'Legal Counsel',
    description: 'Transfer to an attorney for legal questions or case strategy discussion.',
  },
  {
    value: 'legal_counsel_voicemail',
    label: 'Legal Counsel VM',
    description: 'Transfer to attorney voicemail when counsel is unavailable.',
  },
  {
    value: 'billing_and_disbursements',
    label: 'Billing & Disbursements',
    description: 'Transfer to billing department for financial inquiries, settlements, or payments.',
  },
  {
    value: 'intake_and_investigation',
    label: 'Intake & Investigation',
    description: 'Transfer to intake team for new client screening or case investigation.',
  },
  {
    value: 'administration_and_operations',
    label: 'Administration',
    description: 'Transfer to administrative staff for operational or general office matters.',
  },
  {
    value: 'specific_staff_member',
    label: 'Specific Staff Member',
    description: 'Transfer to a specific named staff member requested by the caller.',
  },
  {
    value: 'specific_staff_voicemail',
    label: 'Specific Staff VM',
    description: 'Transfer to a specific staff member\'s voicemail.',
  },
  {
    value: 'unspecified_internal_transfer',
    label: 'Unspecified Internal',
    description: 'Internal transfer where the specific destination was not clearly identified.',
  },
];

export const OPERATIONAL_STATE_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'entered_transfer_path',
    label: 'Entered Transfer Path',
    description: 'Caller was successfully placed into the transfer path. Transfer intent was stated and call proceeded.',
  },
  {
    value: 'transfer_failed_fallback_accepted',
    label: 'Transfer Failed - Fallback Accepted',
    description: 'Transfer could not be completed, but an alternative resolution (message, callback) was accepted.',
  },
  {
    value: 'transfer_failed_no_fallback',
    label: 'Transfer Failed - No Fallback',
    description: 'Transfer failed and no alternative resolution was established.',
  },
  {
    value: 'direct_resolution',
    label: 'Direct Resolution',
    description: 'Issue was resolved directly by the receptionist without needing a transfer.',
  },
  {
    value: 'call_terminated_prematurely',
    label: 'Call Terminated Prematurely',
    description: 'Call ended before any operational terminal state could be established.',
  },
];

export const RESOLUTION_BASIS_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'transfer_path_entered',
    label: 'Transfer Path Entered',
    description: 'Resolution achieved because caller was placed into the transfer path.',
  },
  {
    value: 'fallback_accepted',
    label: 'Fallback Accepted',
    description: 'Resolution achieved through an accepted fallback (message taken, callback scheduled).',
  },
  {
    value: 'direct_service_completed',
    label: 'Direct Service Completed',
    description: 'Resolution achieved by directly addressing the caller\'s need.',
  },
  {
    value: 'no_terminal_action',
    label: 'No Terminal Action',
    description: 'No valid operational terminal state was reached.',
  },
];

export const SECONDARY_ACTION_DEFINITIONS: FieldDefinition[] = [
  {
    value: 'message_taken',
    label: 'Message Taken',
    description: 'A message was taken as a secondary action after transfer failed.',
  },
  {
    value: 'callback_scheduled',
    label: 'Callback Scheduled',
    description: 'A callback was scheduled as a secondary action after transfer failed.',
  },
  {
    value: 'next_steps_documented',
    label: 'Next Steps Documented',
    description: 'Next steps were documented for follow-up.',
  },
  {
    value: 'null',
    label: 'None',
    description: 'No secondary action was taken. This is expected when transfer succeeds.',
  },
];

// Category groupings for the info page
export const ALL_CATEGORIES: CategoryDefinition[] = [
  {
    name: 'Caller Type',
    description: 'Identifies who is calling and their relationship to the firm. Spanish speakers are prioritized regardless of their role.',
    fields: CALLER_TYPE_DEFINITIONS,
  },
  {
    name: 'Primary Intent',
    description: 'The main reason for the call - what the caller is trying to accomplish.',
    fields: PRIMARY_INTENT_DEFINITIONS,
  },
  {
    name: 'Resolution Type',
    description: 'How the call was operationally resolved. If any transfer was attempted, this must be "Transfer Attempted".',
    fields: RESOLUTION_TYPE_DEFINITIONS,
  },
  {
    name: 'Transfer Destination',
    description: 'Where calls are transferred to within the organization.',
    fields: TRANSFER_DESTINATION_DEFINITIONS,
  },
  {
    name: 'Operational Terminal State',
    description: 'The final operational state of the call - what actually happened.',
    fields: OPERATIONAL_STATE_DEFINITIONS,
  },
  {
    name: 'Resolution Basis',
    description: 'The basis on which resolution was determined. Maps directly from operational terminal state.',
    fields: RESOLUTION_BASIS_DEFINITIONS,
  },
  {
    name: 'Secondary Action',
    description: 'Fallback action taken when transfer fails. Must be null if transfer succeeded.',
    fields: SECONDARY_ACTION_DEFINITIONS,
  },
];

// Helper to get definition by value
export function getDefinition(category: FieldDefinition[], value: string): FieldDefinition | undefined {
  return category.find(d => d.value === value || d.value === value.toLowerCase().replace(/ /g, '_'));
}

// Helper to get tooltip text for a filter value
export function getTooltip(categoryName: string, value: string): string | undefined {
  const category = ALL_CATEGORIES.find(c => c.name === categoryName);
  if (!category) return undefined;
  const def = category.fields.find(f => f.value === value || f.label === value);
  return def?.description;
}
