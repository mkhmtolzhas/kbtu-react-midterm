// aria-describedby value matching the hint/error ids rendered by <FormField>.
export function describedBy(id, { hint, error }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
