// The sidebar search index, built by garageSearch() in vite.plugins.ts.
declare module 'virtual:garage-search' {
  export interface SearchSection { id: string; heading: string; text: string }
  export interface SearchDoc { car: string; slug: string; title: string; sections: SearchSection[] }
  const docs: SearchDoc[];
  export default docs;
}
