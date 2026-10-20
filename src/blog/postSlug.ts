/** A post's URL slug: its Markdown filename without any numeric ordering prefix. */
export const postSlug = (path: string) => path.split('/').pop()!.replace(/\.md$/, '').replace(/^\d+-/, '');
