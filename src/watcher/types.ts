export interface OpenApiDiffResult {
  breakingDifferencesFound?: boolean;
  breakingDifferences?: Array<{
    type?: string;
    action?: string;
    code?: string;
    destinationSpecEntityDetails?: Array<any>;
    entity?: string;
    source?: string;
    sourceSpecEntityDetails?: Array<any>;
  }>;
  nonBreakingDifferences?: Array<{
    type?: string;
    action?: string;
    code?: string;
    destinationSpecEntityDetails?: Array<any>;
    entity?: string;
    source?: string;
    sourceSpecEntityDetails?: Array<any>;
  }>;
  unclassifiedDifferences?: Array<{
    type?: string;
    action?: string;
    code?: string;
    destinationSpecEntityDetails?: Array<any>;
    entity?: string;
    source?: string;
    sourceSpecEntityDetails?: Array<any>;
  }>;
}

export interface DiffSummary {
  breaking: number;
  added: number;
  removed: number;
  deprecated: number;
} 