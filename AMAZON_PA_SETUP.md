# Amazon Product Advertising API Setup Guide

This document explains how to set up and use the Amazon Product Advertising (PA) API integration for the Wichtel app.

## Overview

The Wichtel app now includes real Amazon product search functionality via the **Product Advertising API v5**. This allows users to browse actual Amazon products with:
- Real product images
- Accurate pricing
- Customer ratings and reviews
- Direct Amazon affiliate links (with your commission)

## Security

Your Amazon PA API credentials (Access Key & Secret Key) are **never exposed to the frontend**. All product searches are handled securely on the backend using AWS Signature Version 4 signing.

```
User (Frontend)
    ↓
GiftIdeaBrowser.js (calls /api/amazon/search)
    ↓
Backend: /api/amazon/search.js
    ↓
lib/amazonPA.js (signs request with AWS credentials)
    ↓
Amazon PA API
    ↓
Returns products (no credentials exposed to client)
```

## Setup Steps

### 1. Get Amazon PA Credentials

You need an active Amazon Associates account:

1. Go to [Amazon Associates Program](https://affiliate-program.amazon.de/) (or .com/.co.uk etc for other regions)
2. Create or log into your associates account
3. Go to **Product Advertising API** section
4. Request access to Product Advertising API v5
5. Once approved, generate new **Access Key** and **Secret Key**
6. Also get your **Partner Tag** (your Associate ID) - should already be set to `httpwwwspor03-21`

### 2. Add Credentials to Environment

Create `.env.local` in the project root with your credentials:

```env
# Amazon Product Advertising API Credentials (CONFIDENTIAL!)
AMAZON_PA_ACCESS_KEY=your-access-key-here
AMAZON_PA_SECRET_KEY=your-secret-key-here
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=httpwwwspor03-21
```

**⚠️ IMPORTANT:**
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your Secret Key completely private
- Only `NEXT_PUBLIC_*` variables are exposed to the frontend (the affiliate tag is public)

### 3. Verify Setup

The app will automatically:
1. Load your credentials from `.env.local` in development
2. Check for credentials before attempting API calls
3. Provide helpful error messages if credentials are missing

When running locally:
- Start the dev server: `npm run dev`
- User selects a gift category and gender in the browser
- App calls `/api/amazon/search` with search query + budget filter
- Real Amazon products are displayed with images, prices, and ratings

## How It Works

### Frontend Flow

**GiftIdeaBrowser.js** component:
1. User selects a **category** (Tech, Lifestyle, Books, etc.)
2. User selects a **gender** (For her / For him)
3. App calls `/api/amazon/search?q=...&maxPrice=...&limit=...`
4. Products are displayed with:
   - Product image
   - Title
   - Price
   - Rating & review count
   - Direct Amazon link

### Backend Implementation

**lib/amazonPA.js** - AWS Signature Version 4 signing:
- Builds the search query
- Creates AWS-compliant request signature
- Handles API errors gracefully
- Transforms responses to gift format

**pages/api/amazon/search.js** - Secure endpoint:
- Validates input (query, max price, limit)
- Checks credentials exist
- Calls the PA API library
- Returns products to client

## Search Behavior

The search query is built from:
- **Category keywords** (e.g., "Technik Gadgets Elektronik" for Tech)
- **Gender prefix** (e.g., "Für Frauen Damen" or "Für Männer Herren")

Example: Searching Tech gifts for women → `"Technik Gadgets Elektronik Für Frauen Damen"`

Products are filtered by:
- Budget (maxPrice parameter)
- Request limit (5, 10, or 15 products)

## API Endpoints

### GET /api/amazon/search

Searches for products on Amazon.

**Query Parameters:**
- `q` (required): Search query string (max 100 chars)
- `maxPrice` (optional): Maximum price in €, e.g., `30`
- `limit` (optional): Number of results (1-10, default 10)

**Example Request:**
```
GET /api/amazon/search?q=Technik+für+Frauen&maxPrice=30&limit=10
```

**Success Response (200):**
```json
{
  "success": true,
  "query": "Technik für Frauen",
  "count": 8,
  "products": [
    {
      "asin": "B08N5WRWNW",
      "name": "Product Title",
      "price": 29,
      "link": "https://amazon.de/dp/B08N5WRWNW?tag=httpwwwspor03-21",
      "imageUrl": "https://...",
      "rating": 4.5,
      "reviewCount": 123,
      "source": "amazon-pa"
    },
    ...
  ]
}
```

**Error Responses:**
- `400`: Missing or invalid parameters
- `500`: Credentials not configured or API error
- `503`: Amazon API temporary error

## Troubleshooting

### Products not showing up?

1. **Check credentials in .env.local:**
   ```bash
   cat .env.local | grep AMAZON_PA
   ```
   Both keys should have values.

2. **Check server logs** (npm run dev):
   - Look for "Amazon PA credentials not configured"
   - Check for AWS signature errors

3. **Verify credentials are valid:**
   - Go to [Amazon Associates Dashboard](https://affiliate-program.amazon.de/)
   - Confirm API credentials are active

4. **Try a simpler search:**
   - Instead of complex queries, try: `"Bluetooth Kopfhörer"`
   - Check network tab in browser Dev Tools

### "Amazon API temporary error"?

This usually means:
- Amazon PA API is temporarily down (rare)
- Too many requests in short time (rate limiting)
- Network connectivity issue

**Solution:** Wait a few moments and try again.

### "Amazon PA API not configured"?

Make sure `.env.local` exists with both keys:
```env
AMAZON_PA_ACCESS_KEY=your-key
AMAZON_PA_SECRET_KEY=your-secret
```

Restart the dev server after adding credentials.

## Production Deployment

When deploying to Vercel or other hosting:

1. **Add secrets to environment:**
   - Go to your hosting platform settings
   - Add `AMAZON_PA_ACCESS_KEY` (private)
   - Add `AMAZON_PA_SECRET_KEY` (private)
   - Add `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` (public is fine)

2. **Never commit .env.local** - it's in .gitignore

3. **Test after deployment:**
   - Check that product search works
   - Verify links have your affiliate tag

## Earning Affiliate Commission

Every time a user:
1. Browses to a product via "Auf Amazon anschauen" link
2. Purchases within 24 hours

You earn your Amazon affiliate commission! The links automatically include your affiliate tag: `httpwwwspor03-21`

## Rate Limiting

Amazon PA API has rate limits. The app respects this by:
- Limiting results to 10 products per request
- Implementing exponential backoff on errors
- Caching on the client side (sort of - users can retry quickly)

If you need more requests, contact Amazon about increasing your quota.

## Regions & Localization

Currently configured for **amazon.de** (German Amazon).

To support other regions:
1. Update `PA_API_ENDPOINT` in `lib/amazonPA.js`
2. Update `REGION` constant (e.g., `eu-west-1` for EU, `us-east-1` for USA)
3. Add region-specific credentials

## Future Improvements

Potential enhancements:
- [ ] Product caching (store results locally for 1 hour)
- [ ] Search history (remember recent searches)
- [ ] Advanced filters (by brand, color, size)
- [ ] Real-time price tracking
- [ ] Competitor price comparison
- [ ] Social sharing with Amazon links

## Support

If you encounter issues:

1. Check browser console (F12 → Console tab)
2. Check server logs (npm run dev terminal)
3. Verify .env.local has both credentials
4. Contact Amazon Associates support for API issues

---

**Last Updated:** 2024
**API Version:** Product Advertising API v5
**Region:** Germany (amazon.de)
