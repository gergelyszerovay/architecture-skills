import { isInputRequiredResult } from '@modelcontextprotocol/server';
import type { ToolOutcome } from './tool-outcome.fixture.ts';

/**
 * Joins a result's text content.
 * @param outcome - The tool's outcome.
 * @returns The text of a normal result, or an empty string for an input-required one.
 */
export const outcomeText = (outcome: ToolOutcome): string =>
  isInputRequiredResult(outcome)
    ? ''
    : outcome.content.map((part) => (part.type === 'text' ? part.text : '')).join('');
