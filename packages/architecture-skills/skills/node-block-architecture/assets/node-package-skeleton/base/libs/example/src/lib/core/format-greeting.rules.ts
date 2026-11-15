/**
 * Words a greeting by the hour of the day: morning before noon, afternoon before six, evening
 * after. A blank name is greeted as `friend`.
 * @param name - The person's name; surrounding blanks are ignored.
 * @param hour - The hour of the day, 0 to 23.
 * @returns The greeting text.
 */
export const formatGreeting = (name: string, hour: number): string => {
  const who = name.trim() === '' ? 'friend' : name.trim();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  return `Good ${part}, ${who}`;
};
