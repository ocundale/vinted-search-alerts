const fetch = require('node-fetch');
const UserAgent = require('user-agents');
const cookie = require('cookie');
const { HttpsProxyAgent } = require('https-proxy-agent');
const config = require('./config');

const cookies = new Map();

async function fetchCookie(domain = 'co.uk') {
  const controller = new AbortController();
  const agent = config.proxy ? new HttpsProxyAgent(config.proxy) : undefined;
  try {
    const res = await fetch(`https://vinted.${domain}`, {
      signal: controller.signal,
      agent,
      headers: {
        'user-agent': new UserAgent().toString(),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const sessionCookie = res.headers.get('set-cookie');
    if (!sessionCookie) {
      controller.abort();
      throw new Error('No cookie returned');
    }
    const cookiesArray = sessionCookie.split(', ');
    let session = null;
    let accessToken = null;
    cookiesArray.forEach((cookieString) => {
      const parsed = cookie.parse(cookieString);
      if (parsed['_vinted_fr_session']) session = parsed['_vinted_fr_session'];
      if (parsed['access_token_web']) accessToken = parsed['access_token_web'];
    });
    controller.abort();
    if (session) cookies.set(domain, session);
    if (accessToken) cookies.set('access', accessToken);
  } catch (err) {
    controller.abort();
    throw err;
  }
}

function generateSearchURL(searchTerm, sizeIds, statusIds, catalogIds, brandIds, priceFrom, priceTo) {
    const baseURL = 'https://www.vinted.co.uk/catalog';
    const params = new URLSearchParams();
    params.append('search_text', searchTerm);
    
    if (priceFrom) {
      params.append('price_from', priceFrom);
    }
    if (priceTo) {
      params.append('price_to', priceTo);
    }
    params.append('page', '1');
    
    if (catalogIds && catalogIds.length) {
      catalogIds.forEach(id => params.append('catalog_ids[]', id));
    }
    if (brandIds && brandIds.length) {
      brandIds.forEach(id => params.append('brand_ids[]', id));
    }
    if (sizeIds && sizeIds.length) {
      sizeIds.forEach(id => params.append('size_ids[]', id));
    }
    if (statusIds && statusIds.length) {
      statusIds.forEach(id => params.append('status_ids[]', id));
    }
    
    // Add extra parameters as needed:
    params.append('order', 'newest_first');
    
    return `${baseURL}?${params.toString()}`;
  }  
  const vintedSearch = async (url, disableOrder = false, allowSwap = false, customParams = {}) => {
    const domain = 'co.uk';
    let c = cookies.get(domain) ?? process.env[`VINTED_API_${domain.toUpperCase()}_COOKIE`];
    let d = cookies.get('access') ?? null;
    if (!c || !d) {
      console.log(`[*] Fetching cookie for ${domain}`);
      await fetchCookie(domain).catch(() => {});
      c = cookies.get(domain) ?? process.env[`VINTED_API_${domain.toUpperCase()}_COOKIE`];
      d = cookies.get('access');
    }
    const queryPart = url.split('?')[1];
    console.log(`--> https://www.vinted.co.uk/api/v2/catalog/items?${queryPart}`);
    const controller = new AbortController();
    try {
      const res = await fetch(`https://www.vinted.co.uk/api/v2/catalog/items?${queryPart}`, {
        signal: controller.signal,
        headers: {
          cookie: `_vinted_fr_session=${c}; access_token_web=${d}`,
          'user-agent': new UserAgent().toString(),
          accept: 'application/json, text/plain, */*',
          referer: 'https://www.vinted.co.uk/',
          origin: 'https://www.vinted.co.uk',
          'accept-language': 'en-US,en;q=0.9'
        }
      });
      const text = await res.text();
      controller.abort();
      try {
        return JSON.parse(text);
      } catch (jsonErr) {
        console.error("Failed to parse JSON. Response was:", text);
        throw jsonErr;
      }
    } catch (err) {
      controller.abort();
      throw err;
    }
  };
  

module.exports = { fetchCookie, generateSearchURL, vintedSearch };
