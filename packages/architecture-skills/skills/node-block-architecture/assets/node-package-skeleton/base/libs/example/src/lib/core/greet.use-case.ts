import type { Clock } from './clock.port.ts';
import { formatGreeting } from './format-greeting.rules.ts';
import type { Greeting } from './greeting.model.ts';

/** The greet use case contract: greets a person by name. */
export type Greet = (input: { name: string }) => Greeting;

/**
 * Builds the greet use case.
 * @param deps - The clock to read the hour from.
 *   - `clock`: The clock port.
 * @returns A function greeting a person at the hour the clock reads.
 * @failure A blank name is greeted as `friend`, not a failure; a clock failure is thrown to the caller unchanged.
 */
export const makeGreet =
  ({ clock }: { clock: Clock }): Greet =>
  (input) => {
    const hour = clock.now().getHours();
    return { text: formatGreeting(input.name, hour), hour };
  };
