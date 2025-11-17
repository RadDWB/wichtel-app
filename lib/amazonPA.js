import crypto from 'crypto';

/**
 * Amazon Product Advertising API v5 Helper
 * Securely handles API requests with AWS Signature Version 4
 */

const PA_API_ENDPOINT = 'https://api.amazon.de/';
const REGION = 'eu-west-1';
const SERVICE = 'ProductAdvertisingAPI';
const ALGORITHM = 'AWS4-HMAC-SHA256';

/**
 * Calculate AWS Signature Version 4
 */
function calculateSignature(
  accessKey,
  secretKey,
  host,
  operation,
  payloadHash,
  timestamp
) {
  const date = timestamp.split('T')[0];
  const credentialScope = `${date}/${REGION}/${SERVICE}/aws4_request`;

  // Create canonical request
  const canonicalRequest = [
    'POST',
    '/',
    '',
    `host:${host}\nx-amz-date:${timestamp}\nx-amz-target:${operation}`,
    '',
    'host;x-amz-date;x-amz-target',
    payloadHash,
  ].join('\n');

  const canonicalRequestHash = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex');

  // Create string to sign
  const stringToSign = [
    ALGORITHM,
    timestamp,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  // Calculate signature
  const kDate = crypto
    .createHmac('sha256', `AWS4${secretKey}`)
    .update(date)
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

  return {
    credentialScope,
    signature,
    canonicalRequest,
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
    throw new Error('Missing Amazon PA credentials in environment');
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const host = 'api.amazon.de';
    const operation = 'ProductAdvertisingAPI_20210630.SearchItems';

    // Build payload
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

    // Handle price filter
    if (maxPrice) {
      payload.MaxPrice = maxPrice * 100; // API expects price in cents
    }

    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto
      .createHash('sha256')
      .update(payloadString)
      .digest('hex');

    // Calculate signature
    const { signature, credentialScope } = calculateSignature(
      accessKey,
      secretKey,
      host,
      operation,
      payloadHash,
      timestamp
    );

    // Create Authorization header
    const authorizationHeader = `${ALGORITHM} Credential=${accessKey}/${credentialScope}, SignedHeaders=host;x-amz-date;x-amz-target, Signature=${signature}`;

    // Make API request
    const response = await fetch(`${PA_API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'Authorization': authorizationHeader,
        'x-amz-date': timestamp,
        'x-amz-target': operation,
        'Host': host,
      },
      body: payloadString,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Amazon PA API error:', errorData);
      throw new Error(`Amazon API error: ${errorData?.__type || 'Unknown error'}`);
    }

    const data = await response.json();

    // Transform response to gift format
    if (!data.SearchResult?.Items) {
      return [];
    }

    return data.SearchResult.Items.map(item => {
      const price = item.Offers?.Listings?.[0]?.Price?.Amount || null;
      const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
      const imageUrl = item.Images?.Primary?.Large?.URL || null;
      const rating = item.CustomerReviews?.StarRating?.DisplayValue || null;
      const reviewCount = item.CustomerReviews?.Count?.DisplayValue || 0;
      const asin = item.ASIN;

      // Build affiliate link
      let affiliateLink = `https://amazon.de/dp/${asin}`;
      if (partnerTag) {
        affiliateLink += `?tag=${partnerTag}`;
      }

      return {
        asin,
        name: title,
        price: price ? Math.floor(price) : null,
        link: affiliateLink,
        imageUrl,
        rating: rating ? parseFloat(rating) : null,
        reviewCount: parseInt(reviewCount) || 0,
        source: 'amazon-pa',
      };
    });
  } catch (error) {
    console.error('Error searching Amazon products:', error);
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
    throw new Error('Missing Amazon PA credentials in environment');
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const host = 'api.amazon.de';
    const operation = 'ProductAdvertisingAPI_20210630.GetItems';

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
        'ItemInfo.Features',
      ],
    };

    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto
      .createHash('sha256')
      .update(payloadString)
      .digest('hex');

    const { signature, credentialScope } = calculateSignature(
      accessKey,
      secretKey,
      host,
      operation,
      payloadHash,
      timestamp
    );

    const authorizationHeader = `${ALGORITHM} Credential=${accessKey}/${credentialScope}, SignedHeaders=host;x-amz-date;x-amz-target, Signature=${signature}`;

    const response = await fetch(`${PA_API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'Authorization': authorizationHeader,
        'x-amz-date': timestamp,
        'x-amz-target': operation,
        'Host': host,
      },
      body: payloadString,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch product details');
    }

    const data = await response.json();
    const item = data.ItemsResult?.Items?.[0];

    if (!item) {
      return null;
    }

    const price = item.Offers?.Listings?.[0]?.Price?.Amount || null;
    const title = item.ItemInfo?.Title?.DisplayValue || 'Unknown Product';
    const imageUrl = item.Images?.Primary?.Large?.URL || null;
    const rating = item.CustomerReviews?.StarRating?.DisplayValue || null;
    const reviewCount = item.CustomerReviews?.Count?.DisplayValue || 0;

    let affiliateLink = `https://amazon.de/dp/${asin}`;
    if (partnerTag) {
      affiliateLink += `?tag=${partnerTag}`;
    }

    return {
      asin,
      name: title,
      price: price ? Math.floor(price) : null,
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
