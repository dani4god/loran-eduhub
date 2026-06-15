export const toStringId = (id: any) => id?.toString();

export const toISODate = (date: any): string | null => {
  if (!date) return null;
  return new Date(date).toISOString();
};