import { diffSpecs } from 'openapi-diff';
import { OpenApiDiffResult, DiffSummary } from './types';

export async function compareSpecs(
  previousSpec: object,
  currentSpec: object
): Promise<OpenApiDiffResult | null> {
  try {
    const diffResult = await diffSpecs({
      sourceSpec: {
        content: JSON.stringify(previousSpec),
        location: 'previous.json',
        format: 'openapi3'
      },
      destinationSpec: {
        content: JSON.stringify(currentSpec),
        location: 'current.json',
        format: 'openapi3'
      }
    });
    return diffResult as OpenApiDiffResult;
  } catch (error) {
    console.error('Error computing API diff:', error);
    return null;
  }
}

export function analyzeDiff(diff: OpenApiDiffResult): DiffSummary {
  const summary: DiffSummary = {
    breaking: diff.breakingDifferences?.length || 0,
    added: 0,
    removed: 0,
    deprecated: 0,
  };

  const allDiffs = [
    ...(diff.breakingDifferences || []),
    ...(diff.nonBreakingDifferences || []),
    ...(diff.unclassifiedDifferences || [])
  ];

  for (const change of allDiffs) {
    if (change.action === 'add') summary.added++;
    if (change.action === 'remove') summary.removed++;
    if (change.code && change.code.includes('deprecat')) summary.deprecated++;
  }

  return summary;
} 
