// -------------------------
// HELPERS FOR SEARCHING & EMAILING
// -------------------------
/**
* Generates a Vinted search URL from a search term plus size and status filters.
* 
* Currently, this function builds a URL with:
*  - search_text
*  - optional parameters (see below)
* 
* Additional optional parameters include:
*  - catalog_ids[]: e.g. '1' or multiple values, e.g. '1','2'
*  - color_ids[]: e.g. '3'
*  - brand_ids[]: e.g. '5'
*  - material_ids[]: e.g. '7'
*  - video_game_rating_ids[]: e.g. '9'
*  - price_from: e.g. '50'
*  - price_to: e.g. '150'
*  - currency: e.g. 'GBP'
*  - order: e.g. 'newest_first'
*/

const { processSearch } = require('./searchProcessor');
const { loadKnownItemsMapping, saveKnownItemsMapping } = require('./persistence');

// Search configurations – each includes a unique "id" property
let SEARCHES = [
  {
    id: "castelli", // Always unique (already viewed items logged against this ID)
    searchTerms: ['castelli'], //terms tp searcj for
    sizeIds: ["208"], // medium
    catalogIds: ["30"], // outdoor category
    brandIds: ["326954"], // castelli
    statusIds: ['1', '6'], //new & new with tags only
    emailRecipient: "test@test.com", //REPLACE WITH EMAIL ADDRESS
    strict:true // search terms MUST appear in title else item rejected
  },
];

// Load known mapping and attach Sets to each search config using the search's id.
const knownMapping = loadKnownItemsMapping();
SEARCHES.forEach(searchConfig => {
  // Use searchConfig.id if provided; otherwise, fall back to stringifying the parameters.
  const key = searchConfig.id || JSON.stringify({
    searchTerms: searchConfig.searchTerms || []
  });
  searchConfig.knownItems = new Set(knownMapping[key] || []);
});

function startMonitoring() {
  // Run searches immediately
  SEARCHES.forEach(searchConfig => processSearch(searchConfig, knownMapping));
  // Schedule every minute (60,000 ms)
  setInterval(() => {
    SEARCHES.forEach(searchConfig => processSearch(searchConfig, knownMapping));
  }, 300000);
}

startMonitoring();
