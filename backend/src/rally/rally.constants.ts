/**
 * Rally Field Configuration
 *
 * This file controls which fields are fetched from Rally and how they are
 * mapped to the internal requirement format used by TestingBuddy AI.
 *
 * To add a new field:
 *   1. Add it to RALLY_FETCH_FIELDS
 *   2. Map it in RALLY_FIELD_MAP
 *   3. Update the RallyRequirement interface in rally.service.ts if needed
 */

// ─────────────────────────────────────────────
// Fields requested from the Rally API
// These are passed as ?fetch=... in the API URL
// Add any additional Rally fields here to retrieve them
// ─────────────────────────────────────────────
export const RALLY_FETCH_FIELDS = [
  'FormattedID',      // e.g. US31488
  'Name',             // Story title
  'Description',      // Full HTML description / acceptance criteria
  'Notes',            // Additional notes
  'c_Requirements',   // Custom field: Requirements section
  'ScheduleState',    // e.g. Defined, In-Progress, Completed, Accepted
  'Priority',         // e.g. High, Medium, Low, None
  // ── Optional fields (uncomment to enable) ──
  // 'Owner',         // Assigned team member
  // 'Iteration',     // Sprint/Iteration the story belongs to
  // 'Release',       // Release the story is targeted for
  // 'Tags',          // Tags / labels on the story
  'c_AcceptanceCriteria', // Custom field: Acceptance Criteria (if configured in Rally)
].join(',')

// ─────────────────────────────────────────────
// Field mapping: Rally API field → internal format
// Controls how each Rally response field is named
// in the returned requirement object
// ─────────────────────────────────────────────
export const RALLY_FIELD_MAP = {
  key:           'FormattedID',       // Unique story ID (e.g. US31488)
  title:         '_refObjectName',    // Display name (falls back to Name)
  titleFallback: 'Name',              // Fallback if _refObjectName is empty
  description:   'Description',       // Story description
  notes:         'Notes',             // Additional notes
  requirements:  'c_Requirements',    // Custom requirements section
  acceptanceCriteria: 'c_AcceptanceCriteria', // Acceptance Criteria
  status:        'ScheduleState',     // Workflow state
  statusDefault: 'Defined',           // Default if ScheduleState is missing
  priority:      'Priority',          // Priority object (access .Name on it)
  priorityDefault: 'None',            // Default if Priority is missing
  issueType:     'User Story',        // Hardcoded — Rally HierarchicalRequirement
} as const

// ─────────────────────────────────────────────
// Rally API endpoints (relative to instanceUrl)
// ─────────────────────────────────────────────
export const RALLY_API = {
  version:              '/slm/webservice/v2.0',
  subscription:         '/slm/webservice/v2.0/subscription',
  userStory:            '/slm/webservice/v2.0/hierarchicalrequirement',
  testCase:             '/slm/webservice/v2.0/testcase',
  testCaseCreate:       '/slm/webservice/v2.0/testcase/create',
} as const
