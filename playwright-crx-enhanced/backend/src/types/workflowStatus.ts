/**
 * Script Workflow Status State Machine
 * Defines allowed transitions and actions per state
 */

export type WorkflowStatus = 
  | 'draft'
  | 'ai_enhanced'
  | 'testdata_ready'
  | 'human_review'
  | 'finalized'
  | 'archived';

export interface WorkflowTransition {
  from: WorkflowStatus;
  to: WorkflowStatus;
  action: string;
  requiredRole?: 'user' | 'admin';
  description: string;
}

export interface WorkflowState {
  status: WorkflowStatus;
  allowedTransitions: WorkflowStatus[];
  allowedActions: string[];
  canRunInCI: boolean;
  requiresHumanApproval: boolean;
  description: string;
}

/**
 * State Machine Definition
 * 
 * Visual Flow:
 * draft → ai_enhanced → testdata_ready → human_review → finalized → archived
 *   ↓         ↓              ↓                ↓
 *   └─────────┴──────────────┴────────────────→ human_review (manual path)
 */

export const WORKFLOW_STATES: Record<WorkflowStatus, WorkflowState> = {
  draft: {
    status: 'draft',
    allowedTransitions: ['ai_enhanced', 'human_review', 'finalized'],
    allowedActions: ['run-ai', 'edit', 'delete', 'manual-review'],
    canRunInCI: false,
    requiresHumanApproval: false,
    description: 'Initial state after script creation'
  },
  
  ai_enhanced: {
    status: 'ai_enhanced',
    allowedTransitions: ['testdata_ready', 'human_review', 'draft'],
    allowedActions: ['generate-testdata', 're-run-ai', 'manual-review', 'edit'],
    canRunInCI: false,
    requiresHumanApproval: false,
    description: 'AI enhancement completed, awaiting test data generation'
  },
  
  testdata_ready: {
    status: 'testdata_ready',
    allowedTransitions: ['human_review', 'ai_enhanced'],
    allowedActions: ['submit-for-review', 're-generate-testdata', 're-run-ai', 'edit'],
    canRunInCI: false,
    requiresHumanApproval: false,
    description: 'Test data generated, ready for human review'
  },
  
  human_review: {
    status: 'human_review',
    allowedTransitions: ['finalized', 'testdata_ready', 'ai_enhanced', 'draft'],
    allowedActions: ['finalize', 'approve', 'reject', 'request-changes', 'edit'],
    canRunInCI: false,
    requiresHumanApproval: true,
    description: 'Awaiting human validation and approval'
  },
  
  finalized: {
    status: 'finalized',
    allowedTransitions: ['archived', 'human_review'],
    allowedActions: ['generate-insights', 'run-in-ci', 'view-insights', 'archive', 'reopen'],
    canRunInCI: true,
    requiresHumanApproval: false,
    description: 'Human approved and ready for CI/production execution'
  },
  
  archived: {
    status: 'archived',
    allowedTransitions: ['draft'],
    allowedActions: ['restore', 'delete'],
    canRunInCI: false,
    requiresHumanApproval: false,
    description: 'Archived/deprecated, not active'
  }
};

/**
 * All allowed transitions with context
 */
export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  // From draft
  { from: 'draft', to: 'ai_enhanced', action: 'run-ai', description: 'Run AI enhancement on raw script' },
  { from: 'draft', to: 'human_review', action: 'manual-review', description: 'Skip AI, go directly to human review' },
  { from: 'draft', to: 'finalized', action: 'quick-finalize', requiredRole: 'admin', description: 'Admin bypass (emergency)' },
  
  // From ai_enhanced
  { from: 'ai_enhanced', to: 'testdata_ready', action: 'generate-testdata', description: 'Generate boundary/equivalence/security test data' },
  { from: 'ai_enhanced', to: 'human_review', action: 'manual-review', description: 'Skip test data, go to review' },
  { from: 'ai_enhanced', to: 'draft', action: 'reject-ai', description: 'Reject AI suggestions, revert to draft' },
  
  // From testdata_ready
  { from: 'testdata_ready', to: 'human_review', action: 'submit-for-review', description: 'Submit for human validation' },
  { from: 'testdata_ready', to: 'ai_enhanced', action: 're-run-ai', description: 'Re-run AI enhancement' },
  
  // From human_review
  { from: 'human_review', to: 'finalized', action: 'approve', description: 'Human approves script and test data' },
  { from: 'human_review', to: 'testdata_ready', action: 'request-testdata-changes', description: 'Request test data regeneration' },
  { from: 'human_review', to: 'ai_enhanced', action: 'request-ai-changes', description: 'Request AI re-enhancement' },
  { from: 'human_review', to: 'draft', action: 'reject', description: 'Reject and start over' },
  
  // From finalized
  { from: 'finalized', to: 'archived', action: 'archive', description: 'Archive finalized script' },
  { from: 'finalized', to: 'human_review', action: 'reopen', description: 'Reopen for changes (creates new version)' },
  
  // From archived
  { from: 'archived', to: 'draft', action: 'restore', description: 'Restore archived script as draft' }
];

/**
 * Validate if a transition is allowed
 */
export function isTransitionAllowed(
  currentStatus: WorkflowStatus,
  targetStatus: WorkflowStatus,
  userRole: 'user' | 'admin' = 'user'
): boolean {
  const state = WORKFLOW_STATES[currentStatus];
  
  if (!state.allowedTransitions.includes(targetStatus)) {
    return false;
  }
  
  // Find transition rule
  const transition = WORKFLOW_TRANSITIONS.find(
    t => t.from === currentStatus && t.to === targetStatus
  );
  
  // Check role requirement
  if (transition?.requiredRole && transition.requiredRole !== userRole && userRole !== 'admin') {
    return false;
  }
  
  return true;
}

/**
 * Get allowed actions for a given workflow status
 */
export function getAllowedActions(status: WorkflowStatus): string[] {
  return WORKFLOW_STATES[status]?.allowedActions || [];
}

/**
 * Check if script can run in CI
 */
export function canRunInCI(status: WorkflowStatus): boolean {
  return WORKFLOW_STATES[status]?.canRunInCI || false;
}

/**
 * Get next recommended states for UI guidance
 */
export function getRecommendedNextStates(status: WorkflowStatus): WorkflowStatus[] {
  const recommendations: Record<WorkflowStatus, WorkflowStatus[]> = {
    draft: ['ai_enhanced'],
    ai_enhanced: ['testdata_ready'],
    testdata_ready: ['human_review'],
    human_review: ['finalized'],
    finalized: ['archived'],
    archived: ['draft']
  };
  
  return recommendations[status] || [];
}

/**
 * Get transition metadata
 */
export function getTransitionMetadata(
  from: WorkflowStatus,
  to: WorkflowStatus
): WorkflowTransition | undefined {
  return WORKFLOW_TRANSITIONS.find(t => t.from === from && t.to === to);
}
