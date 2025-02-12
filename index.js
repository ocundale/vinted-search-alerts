// -------------------------
// HELPERS FOR SEARCHING & EMAILING
// -------------------------
/**
* Generates a Vinted search URL from a search term plus size and status filters.
* 
* Currently, this function builds a URL with:
*  - search_text
*  - page (default is 1)
*  - size_ids[] and status_ids[]
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
// Optional parameters (uncomment and adjust as needed):
// params.append('catalog_ids[]', '1');
// params.append('color_ids[]', '3');
// params.append('brand_ids[]', '5');
// params.append('material_ids[]', '7');
// params.append('video_game_rating_ids[]', '9');
// params.append('price_from', '50');
// params.append('price_to', '150');
// params.append('currency', 'GBP');
// params.append('order', 'newest_first');

const { processSearch } = require('./searchProcessor');
const { loadKnownItemsMapping, saveKnownItemsMapping } = require('./persistence');

// Search configurations – each now includes a unique "id" property.
let SEARCHES = [
  {
    id: "sportiva",
    searchTerms: ['sportiva'],
    sizeIds: ['792', '793', '794'],
    statusIds: ['2', '1', '6', '3'],
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "arkteryx",
    searchTerms: ['arkteryx'],
    sizeIds: ['792', '793', '794'],
    statusIds: ['2', '1', '6', '3'],
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "Aequilibrium",
    searchTerms: ['Aequilibrium'],
    statusIds: ['2', '1', '6', '3'],
    catalogIds: ['1231'],
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "scarpa",
    searchTerms: ['scarpa'],
    sizeIds: ['792', '793', '794'],
    statusIds: ['2', '1', '6', '3'],
    emailRecipient: "ocundale@gmail.com",
  },
  // RAB TROUSERS:
  // size: 1640: 32, size: 1652: M, catalog[]=34 (trousers)
  {
    id: "rab",
    searchTerms: ['rab'],
    sizeIds: ['1640', '1652', '794'],
    statusIds: ['2', '1', '6', '3'],
    catalogIds: ['34'],
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "five fingers",
    searchTerms: ['five fingers'],
    sizeIds: ["792"],
    catalogIds: ["1231"],
    statusIds: ['1', '6'], // new, new tags
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "asics",
    searchTerms: ['asics'],
    sizeIds: ["794,793"],
    catalogIds: ["5"],
    statusIds: ['1', '6'], // new, new tags
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "shokz",
    searchTerms: ['Shokz OpenRun Pro 2'],
    priceFrom: "50",
    priceTo: "130",
    emailRecipient: "ocundale@gmail.com",
    strict: true
  },
  {
    id: "castelli",
    searchTerms: ['castelli'],
    sizeIds: ["208"],
    catalogIds: ["30"],
    brandIds: ["326954"],
    statusIds: ['2', '1', '6', '3'],
    emailRecipient: "ocundale@gmail.com",
  },
  {
    id: "dji_flip",
    searchTerms: ['dji flip'],
    emailRecipient: "ocundale@gmail.com",
    strict: true  // Only items with both "dji" and "flip" in the title will pass.
  }
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
