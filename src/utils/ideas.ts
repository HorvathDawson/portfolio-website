/**
 * Design experiments (the outline camp, the fisher and the paraglider) show
 * only with ?ideas in the address, so they can be tried on the live site
 * without anyone else seeing them.
 */
export const showIdeas = (search = window.location.search) => new URLSearchParams(search).has('ideas');
