const { generateSearchURL, vintedSearch } = require('./vintedApi');
const { sendEmail } = require('./email');
const { saveKnownItemsMapping } = require('./persistence');

/**
 * Generates a mapping key for a search config.
 * Uses searchConfig.id if provided; otherwise, stringifies all parameters.
 */
function getSearchKey(searchConfig) {
  return searchConfig.id || JSON.stringify({
    searchTerms: searchConfig.searchTerms || [],
    sizeIds: searchConfig.sizeIds || [],
    statusIds: searchConfig.statusIds || [],
    catalogIds: searchConfig.catalogIds || [],
    brandIds: searchConfig.brandIds || [],
    priceFrom: searchConfig.priceFrom || "",
    priceTo: searchConfig.priceTo || "",
    emailRecipient: searchConfig.emailRecipient
  });
}

/**
 * Processes one search configuration:
 *  - For each search term in the config, it builds the URL using all parameters.
 *  - It queries Vinted and combines the returned items (deduplicated by item ID).
 *  - It compares against known items (stored in memory and on disk) to identify new items.
 *  - If new items exist, it sends an email with their details.
 */
async function processSearch(searchConfig, knownMapping) {
    console.log(`[+] Running search for: ${searchConfig.searchTerms.join(', ')}`);
    let combinedResults = new Map();
    
    // Loop over each search term configured.
    for (let term of searchConfig.searchTerms) {
      // Build the URL with all optional parameters.
      const url = generateSearchURL(
        term,
        searchConfig.sizeIds || [],
        searchConfig.statusIds || [],
        searchConfig.catalogIds || [],
        searchConfig.brandIds || [],
        searchConfig.priceFrom || "",
        searchConfig.priceTo || ""
      );
      console.log(`[*] Searching URL: ${url}`);
      try {
        const result = await vintedSearch(url);
        if (result && result.items && Array.isArray(result.items)) {
          // Split the search term into individual words (lowercased)
          const words = term.toLowerCase().split(/\s+/);
          
          result.items.forEach(item => {
            if (item.title) {
              const title = item.title.toLowerCase();
              if (searchConfig.strict) {
                // Strict mode: only add items where every word from the search term is present in the title.
                if (words.every(word => title.includes(word))) {
                  combinedResults.set(item.id, item);
                }
              } else {
                // Non-strict mode: add all items
                combinedResults.set(item.id, item);
              }
            }
          });
        }
      } catch (err) {
        console.error(`[!] Error searching term "${term}":`, err);
      }
    }
    
    // Determine which items are new (i.e. not in the known items set).
    let newItems = [];
    for (let [id, item] of combinedResults) {
      if (!searchConfig.knownItems.has(id)) {
        newItems.push(item);
        searchConfig.knownItems.add(id);
      }
    }
    
    if (newItems.length > 0) {
      console.log(`[+] Found ${newItems.length} new items for search "${searchConfig.searchTerms.join(', ')}". Sending email...`);
      
      // Build an HTML email body with inline images (if available)
      let emailBody = newItems.map(item => {
        const price = item.price;
        const formattedPrice = price
          ? `${price.currency_code === 'GBP' ? '£' : price.currency_code}${parseFloat(price.amount).toFixed(2)}`
          : 'N/A';
        const photoUrl = (item.photo && item.photo.url) ? item.photo.url : null;
        
        return `<div style="margin-bottom:20px;">
          <strong>Title:</strong> ${item.title}<br>
          <strong>URL:</strong> <a href="${item.url}">${item.url}</a><br>
          <strong>Price:</strong> ${formattedPrice}<br>
          <strong>Size:</strong> ${item.size_title || 'N/A'}<br>
          <strong>Status:</strong> ${item.status || 'N/A'}<br>
          ${photoUrl ? `<img src="${photoUrl}" alt="${item.title}" style="max-width:300px; margin-top:10px;">` : '<em>No photo available</em>'}
        </div>`;
      }).join('<hr>');
      
      try {
        await sendEmail(searchConfig.emailRecipient, `New Vinted Items for "${searchConfig.searchTerms.join(', ')}"`, emailBody);
        console.log(`[+] Email sent.`);
      } catch (err) {
        console.error(`[!] Error sending email:`, err);
      }
    } else {
      console.log(`[-] No new items found for search "${searchConfig.searchTerms.join(', ')}".`);
    }
    
    // Update the persistent mapping using the unique key.
    const key = getSearchKey(searchConfig);
    knownMapping[key] = Array.from(searchConfig.knownItems);
    saveKnownItemsMapping(knownMapping);
  }  

module.exports = { processSearch };
