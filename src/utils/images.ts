export const getFirstImageUrl = (imageField: string | null | undefined): string | null => {
  if (!imageField) return null;
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed[0] as string;
    }
  } catch {
    // não é JSON, retornar como está
    if (typeof imageField === 'string' && imageField.trim().length > 0) {
      return imageField;
    }
  }
  return null;
};