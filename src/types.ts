export type NodeTier = 'industry' | 'domain' | 'role' | 'scenario' | 'solution';

export type SolutionCategory =
  | 'AI Solution'
  | 'Process Improvement'
  | 'Automation Fit'
  | 'Requirements Gap';

/**
 * Most sensitive data the outcome would touch. Which law applies is named
 * per outcome in `regulations`.
 *  public      published or aggregate data, no personal records
 *  internal    operational data without personal or protected records
 *  regulated   personal data protected by a sector law (FERPA, HIPAA, CJIS…)
 *  restricted  the highest tier inside a regime: SSNs, federal tax info,
 *              SUD/psychotherapy notes, juvenile or victim records,
 *              security-sensitive plans
 */
export type DataSensitivity = 'public' | 'internal' | 'regulated' | 'restricted';

export interface Regulation {
  name: string;
  summary: string;
}

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
  /** Keys into Taxonomy.regulations, most relevant first. */
  regulations?: string[];
  details: SolutionDetails;
}

export type AtlasNode = BranchNode | ScenarioNode | SolutionNode;

export interface Taxonomy {
  /** Glossary of the laws and standards outcomes refer to. */
  regulations?: Record<string, Regulation>;
  nodes: AtlasNode[];
}

export type LayoutDirection = 'LR' | 'TB';
