export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Replace spaces and other chars with hyphen
    .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphen
    .replace(/--+/g, '-');           // Replace multiple hyphens with single hyphen
}

export function deslugify(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}
