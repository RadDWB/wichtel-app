import crypto from 'crypto';

/**
 * Amazon Product Advertising API v5 Helper
 * Securely handles API requests with AWS Signature Version 4
 */

const REGION = 'eu-west-1';
const SERVICE = 'ProductAdvertisingAPI';
const ALGORITHM = 'AWS4-HMAC-SHA256';

/**
 * Sign AWS request using Signature Version 4
 */
function signRequest(method, uri, host, payload, accessKey, secretKey) {
  const now = new Date();
  const amzDate = now
    .toISOString()
    .replace(/[:\-]|\.\d{3}/g, '')
    .replace('Z', '');
  const dateStamp = amzDate.substring(0, 8);

  // Canonical request components
  const payloadHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex');

  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-date:${amzDate}`,
    `x-amz-target:ProductAdvertisingAPI_20210630.SearchItems`,
  ].sort().join('\n') + '\n';

  const signedHeaders = 'host;x-amz-date;x-amz-target';

  const canonicalRequest = [
    method,
    uri,
    '', // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const canonicalRequestHash = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex');

  // String to sign
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  // Calculate signature
  const kDate = crypto
    .createHmac('sha256', 'AWS4' + secretKey)
    .update(dateStamp)
    .digest();

  const kRegion = crypto
    .createHmac('sha256', kDate)
    .update(REGION)
    .digest();

  const kService = crypto
    .createHmac('sha256', kRegion)
    .update(SERVICE)
    .digest();

  const kSigning = crypto
    .createHmac('sha256', kService)
    .update('aws4_request')
    .digest();

  const signature = crypto
    .createHmac('sha256', kSigning)
    .update(stringToSign)
    .digest('hex');

  const authHeader = `${ALGORITHM} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    authorization: authHeader,
    amzDate,
  };
}

/**
 * Search products on Amazon using Product Advertising API
 */
export async function searchAmazonProducts(
  query,
  {
    accessKey = process.env.AMAZON_PA_ACCESS_KEY,
    secretKey = process.env.AMAZON_PA_SECRET_KEY,
    partnerTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG,
    maxPrice = null,
    limit = 10,
  } = {}
) {
  if (!accessKey || !secretKey || !partnerTag) {
    const missing = [];
    if (!accessKey) missing.push('AMAZON_PA_ACCESS_KEY');
    if (!secretKey) missing.push('AMAZON_PA_SECRET_KEY');
    if (!partnerTag) missing.push('NEXT_PUBLIC_AMAZON_AFFILIATE_TAG');
    throw new Error(`Missing credentials: ${missing.join(', ')}`);
  }

  try {
    const host = 'api.amazon.de';
    const uri = '/paapi5/searchitems';

    // Build search payload
    const payload = {
      PartnerTag: partnerTag,
      PartnerType: 'Associates',
      SearchIndex: 'All',
      Keywords: query,
      ItemCount: Math.min(limit, 10),
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating',
      ],
    };

    if (maxPrice) {
      payload.MaxPrice = Math.ceil(maxPrice * 100); // cents
    }

    console.log('🔍 Searching Amazon PA for:', { query, maxPrice, limit });

    // Sign the request
    const { authorization, amzDate } = signRequest(
      'POST',
      uri,
      host,
      payload,
      accessKey,
      secretKey
    );

    // Make the API call
    const response = await fetch(`https://${host}${uri}`, {
      method: 'POST',
      headers: {
        'Host': host,
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI_20210630.SearchItems',
        'Authorization': authorization,
        'X-Amz-Date': amzDate,
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Amazon PA Response Status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ API Error:', { status: response.status, body: text });

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed (${response.status}): Check your access key and secret key`);
      }
      if (response.status === 429) {
        throw new Error('Rate limited: Too many requests. Try again in a moment.');
      }
      if (response.status >= 500) {
        throw new Error(`Amazon API error (${response.status}): Server error, try again later`);
      }

      throw new Error(`Amazon API returned ${response.status}: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    console.log('✅ Amazon PA Response received, items:', data.SearchResult?.Items?.length || 0);

    // Check for API errors in the response
    if (data['Errors']) {
      const errors = data['Errors'];
      console.error('❌ API Errors:', errors);
      throw new Error(`Amazon API Error: ${errors[0]?.Message || 'Unknown error'}`);
    }

    // Transform results
    if (!data.SearchResult?.Items || data.SearchResult.Items.length === 0) {
      console.warn('⚠️ No products found for query:', query);
      return [];
    }

    return data.SearchResult.Items.map((item) => {
      const price = item.Offers?.Listings?.[0]?.Price?.Amount;
      const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
      const imageUrl = item.Images?.Primary?.Large?.URL;
      const rating = item.CustomerReviews?.StarRating?.DisplayValue;
      const reviewCount = item.CustomerReviews?.Count?.DisplayValue || 0;
      const asin = item.ASIN;

      let affiliateLink = `https://amazon.de/dp/${asin}`;
      if (partnerTag) {
        affiliateLink += `?tag=${encodeURIComponent(partnerTag)}`;
      }

      return {
        asin,
        name: title,
        price: price ? Math.round(parseFloat(price)) : null,
        link: affiliateLink,
        imageUrl,
        rating: rating ? parseFloat(rating) : null,
        reviewCount: parseInt(reviewCount) || 0,
        source: 'amazon-pa',
      };
    });
  } catch (error) {
    console.error('❌ Error in searchAmazonProducts:', error.message);
    throw error;
  }
}

/**
 * Get product details by ASIN
 */
export async function getAmazonProductByASIN(
  asin,
  {
    accessKey = process.env.AMAZON_PA_ACCESS_KEY,
    secretKey = process.env.AMAZON_PA_SECRET_KEY,
    partnerTag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG,
  } = {}
) {
  if (!accessKey || !secretKey || !partnerTag) {
    throw new Error('Missing Amazon PA credentials');
  }

  try {
    const host = 'api.amazon.de';
    const uri = '/paapi5/getitems';

    const payload = {
      PartnerTag: partnerTag,
      PartnerType: 'Associates',
      ItemIds: [asin],
      Resources: [
        'Images.Primary.Large',
        'ItemInfo.Title',
        'Offers.Listings.Price',
        'CustomerReviews.Count',
        'CustomerReviews.StarRating',
      ],
    };

    const { authorization, amzDate } = signRequest(
      'POST',
      uri,
      host,
      payload,
      accessKey,
      secretKey
    );

    const response = await fetch(`https://${host}${uri}`, {
      method: 'POST',
      headers: {
        'Host': host,
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'ProductAdvertisingAPI_20210630.GetItems',
        'Authorization': authorization,
        'X-Amz-Date': amzDate,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch product (${response.status})`);
    }

    const data = await response.json();

    if (data['Errors']) {
      throw new Error(`API Error: ${data['Errors'][0]?.Message}`);
    }

    const item = data.ItemsResult?.Items?.[0];
    if (!item) return null;

    const price = item.Offers?.Listings?.[0]?.Price?.Amount;
    const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
    const imageUrl = item.Images?.Primary?.Large?.URL;
    const rating = item.CustomerReviews?.StarRating?.DisplayValue;
    const reviewCount = item.CustomerReviews?.Count?.DisplayValue || 0;

    let affiliateLink = `https://amazon.de/dp/${asin}`;
    if (partnerTag) {
      affiliateLink += `?tag=${encodeURIComponent(partnerTag)}`;
    }

    return {
      asin,
      name: title,
      price: price ? Math.round(parseFloat(price)) : null,
      link: affiliateLink,
      imageUrl,
      rating: rating ? parseFloat(rating) : null,
      reviewCount: parseInt(reviewCount) || 0,
      source: 'amazon-pa',
    };
  } catch (error) {
    console.error('Error fetching Amazon product:', error);
    throw error;
  }
}
