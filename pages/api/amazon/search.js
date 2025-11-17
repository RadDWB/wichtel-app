import { searchAmazonProducts } from '../../../lib/amazonPA';

/**
 * Search Amazon products via Product Advertising API
 * Secure backend endpoint - never exposes credentials to client
 */
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, maxPrice, limit } = req.query;

    // Validate required parameters
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query (q) is required' });
    }

    if (q.length > 100) {
      return res.status(400).json({ error: 'Search query too long (max 100 characters)' });
    }

    // Validate optional parameters
    let parsedMaxPrice = null;
    if (maxPrice) {
      parsedMaxPrice = parseInt(maxPrice, 10);
      if (isNaN(parsedMaxPrice) || parsedMaxPrice <= 0) {
        return res.status(400).json({ error: 'maxPrice must be a positive number' });
      }
    }

    let parsedLimit = 10;
    if (limit) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 10) {
        return res.status(400).json({ error: 'limit must be between 1 and 10' });
      }
    }

    // Check credentials
    if (!process.env.AMAZON_PA_ACCESS_KEY || !process.env.AMAZON_PA_SECRET_KEY) {
      console.error('Amazon PA credentials not configured');
      return res.status(500).json({
        error: 'Amazon PA API not configured. Please set credentials in environment.',
      });
    }

    // Search products
    const products = await searchAmazonProducts(q.trim(), {
      accessKey: process.env.AMAZON_PA_ACCESS_KEY,
      secretKey: process.env.AMAZON_PA_SECRET_KEY,
      partnerTag: process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG,
      maxPrice: parsedMaxPrice,
      limit: parsedLimit,
    });

    return res.status(200).json({
      success: true,
      query: q.trim(),
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('❌ Error in Amazon search API:', error);

    // Determine error type and provide appropriate response
    if (error.message.includes('Missing Amazon PA credentials')) {
      console.error('⚠️ Missing credentials:', {
        hasAccessKey: !!process.env.AMAZON_PA_ACCESS_KEY,
        hasSecretKey: !!process.env.AMAZON_PA_SECRET_KEY,
        hasPartnerTag: !!process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG,
      });
      return res.status(500).json({
        error: 'Amazon PA API credentials not configured',
        hint: 'Please add AMAZON_PA_ACCESS_KEY and AMAZON_PA_SECRET_KEY to environment variables',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    if (error.message.includes('Amazon API error')) {
      return res.status(503).json({
        error: 'Amazon API returned an error. Please try again later.',
        hint: 'This might be due to invalid credentials or API rate limiting',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }

    return res.status(500).json({
      error: error.message || 'Failed to search products',
      hint: 'Check the server logs for more details',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
