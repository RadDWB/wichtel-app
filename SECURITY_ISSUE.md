# 🔴 SECURITY ISSUE: API Exposes Sensitive PINs

## ⚠️ CRITICAL - FIX TOMORROW

### The Problem
The `/api/groups/list` endpoint publicly exposes the `organizerPin` (3-digit admin PIN) **without any authentication required**.

Anyone can call:
```bash
GET /api/groups/list?groupId=bb84b961
```

And receive a response that includes:
```json
{
  "groups": [
    {
      "id": "bb84b961",
      "name": "...",
      "organizerPin": "461",  // 🔴 EXPOSED!
      ...
    }
  ]
}
```

### How It's Exposed
1. **No authentication check** - endpoint accepts any request without credentials
2. **Direct database data** - API returns group object as-is, including `organizerPin`
3. **Multiple access vectors**:
   - `GET /api/groups/list?groupId=xxx` - returns specific group
   - `GET /api/groups/list?organizerId=xxx&pin=xxx` - filters by PIN but still returns it
   - `GET /api/groups/list` - returns all groups (for "admin/public view")

### Why It's a Problem
- The `organizerPin` controls access to the organizer dashboard
- Dashboard link is public (shared in participant lists)
- Anyone discovering the group ID can extract the PIN
- This defeats the entire authentication mechanism

### What Needs to Be Fixed
**Affected Files:**
- `pages/api/groups/list.js` - All GET responses return unfiltered data

**Solution approach:**
- Filter sensitive data at API layer before sending response
- Create `sanitizeGroupForResponse(group, context)` function in `lib/kv.js`
- Remove `organizerPin` from all API responses
- Apply to all endpoints that return group data

### Files to Modify
1. `lib/kv.js` - Add sanitization function
2. `pages/api/groups/list.js` - Apply sanitization to GET responses

### Test Case
**Before fix:**
```bash
curl "https://wichtel-app-three.vercel.app/api/groups/list?groupId=bb84b961" | grep organizerPin
# Returns: "organizerPin": "461"
```

**After fix:**
```bash
curl "https://wichtel-app-three.vercel.app/api/groups/list?groupId=bb84b961" | grep organizerPin
# Returns: (nothing - PIN removed from response)
```

---
**Status:** PENDING FIX
**Priority:** HIGH
**Discovered:** 2025-12-02
**Target:** Fix tomorrow morning
