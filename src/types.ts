export type NodeTier = 'industry' | 'domain' | 'role' | 'scenario' | 'solution';

export type SolutionCategory =
  | 'AI Solution'
  | 'Process Improvement'
  | 'Automation Fit'
  | 'Requirements Gap';

/**
 * Most sensitive data the outcome would touch.
 *  public      catalog, published policy, no student records
 *  internal    institutional operations data, no student-identifiable records
 *  ferpa       education records / student PII protected by FERPA
 *  restricted  FERPA plus stricter regimes: SSNs, FAFSA federal tax info,
 *              GLBA-covered aid data, health/counseling, disability, Title IX
 */
export type DataSensitivity = 'public' | 'internal' | 'ferpa' | 'restricted';

/** How ready the organization typically is to act on this outcome. */
export type Readiness = 'ready' | 'needs-work' | 'blocked';

export interface ScenarioDetails {
  context: string;
  problemStatement: string;
}

export interface SolutionDetails {
  description: string;
  pattern?: string;
  implementationSteps: string[];
  keyBlockers: string[];
  signals?: string[];
  privacyNotes?: string[];
}

interface BaseNode {
  id: string;
  label: string;
  parentId: string | null;
  childrenIds: string[];
  summary?: string;
  tags?: string[];
}

export interface BranchNode extends BaseNode {
  type: Exclude<NodeTier, 'scenario' | 'solution'>;
}

export interface ScenarioNode extends BaseNode {
  type: 'scenario';
  details: ScenarioDetails;
}

export interface SolutionNode extends BaseNode {
  type: 'solution';
  solutionCategory: SolutionCategory;
  readiness: Readiness;
  dataSensitivity: DataSensitivity;
  details: SolutionDetails;
}

export type AtlasNode = BranchNode | ScenarioNode | SolutionNode;

export interface Taxonomy {
  nodes: AtlasNode[];
}

export type LayoutDirection = 'LR' | 'TB';
