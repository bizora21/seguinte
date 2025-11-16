export const getFirstImageUrl = (imageField: string | null | undefined): string | null => {
  if (!imageField) return null;
  let url: string | null = null;
  
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      url = parsed[0] as string;
    }
  } catch {
    if (typeof imageField === 'string' && imageField.trim().length > 0) {
      url = imageField;
    }
  }
  
  if (url) {
    // Limpeza agressiva de caminhos duplicados comuns no Supabase
    return url.replace('/product-images/public/public/', '/product-images/public/');
  }
  
  return null;
};

export const getAllImageUrls = (imageField: string | null | undefined): string[] => {
  if (!imageField) return [];
  let urls: string[] = [];
  
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed)) {
      urls = parsed.filter(url => typeof url === 'string');
    }
  } catch {
    if (typeof imageField === 'string' && imageField.trim().length > 0) {
      urls = [imageField];
    }
  }
  
  // Aplicar limpeza a todas as URLs
  return urls.map(url => url.replace('/product-images/public/public/', '/product-images/public/'));
};