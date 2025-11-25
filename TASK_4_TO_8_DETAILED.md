# TASKS 4-8: DETAILED IMPLEMENTATION GUIDE

**Status:** Ready to Implement (Task 1-3 Complete)
**Start Date:** 2025-11-25
**Next Context Should Start Here**

---

## 📌 QUICK RECAP - WHAT'S DONE

✅ Task 1: Plan & Spec
✅ Task 2: pages/[groupId]/pairings.js (Refactored for VAR 1 & VAR 3)
✅ Task 3: pages/[groupId]/pairings/[participantId].js (Title & Header Updated)

---

## 🎯 TASK 4: pages/join/[groupId].js - PRIVATE MODI (VAR 2 & VAR 4)

**File Size:** 1709 Zeilen - GROSSE DATEI!
**Path:** `c:\Users\rad3\OneDrive\Dokumente\GithubNew\StrichlisteRepo\StrichlisteChat\wichtel-app\pages\join\[groupId].js`

### WHAT THIS FILE DOES:
- Participant entry point for joining a group
- Shows participant list
- Handles PIN entry
- Shows participant dashboard

### WHAT TO CHANGE FOR VAR 2 & VAR 4:

**VAR 2 (Mutual+Private):**
```
Flow:
1. Participant sees TNListe
2. Clicks own name
3. PIN required
4. Shows: "XY wird überrascht"
5. Text: "Denk dir was Schönes aus"
6. Budget anzeigen
7. NO Amazon Filter
8. Back-Link zur TNListe
```

**VAR 4 (Flexible+Private):**
```
Flow:
1. Participant sees TNListe
2. Clicks own name
3. PIN required
4. Shows: "Du beschenst XY"
5. If Überraschung: Same as VAR 2
6. If Wunschliste: Show gift list
7. Budget anzeigen
8. NO Amazon Filter
9. Back-Link zur TNListe
```

### KEY LOGIC TO ADD:
- After participant selects themselves + PIN verified
- Check: `group.settings.surpriseMode` (mutual vs flexible)
- If mutual: Show "XY wird überrascht"
- If flexible: Show "Du beschenst XY" + wunschliste if exists
- Hide Amazon filters for private mode

### FILES TO STUDY FIRST:
- pages/[groupId]/pairings/[participantId].js (for reference - similar layout)
- lib/constants.js (for any gift-related utilities)

---

## 🎯 TASK 5 & 6: Organizer Dashboard + Draw Page

### TASK 5: pages/organizer/[id].js (MAIN DASHBOARD)

**File Size:** ~1100 Zeilen
**Path:** `pages/organizer/[id].js`

**Changes Needed:**

1. **Add State for Draw Success Popup:**
   ```javascript
   const [showDrawSuccess, setShowDrawSuccess] = useState(false);
   ```

2. **Handle URL Param on mount:**
   ```javascript
   useEffect(() => {
     if (router.query.drawSuccess === 'true') {
       setShowDrawSuccess(true);
     }
   }, [router.query]);
   ```

3. **Render Popup Modal (when showDrawSuccess === true):**
   ```
   Show: "Auslosung erfolgreich ✓"
   Text: "Versende den Link unten"
   Orange Link-Box: (already exists, lines 801-820)
   Button: "Okay" → setShowDrawSuccess(false)
   ```

4. **The Orange Link-Box is already there** (lines 801-820)
   - Don't change it
   - It will auto-populate with correct link from API

---

### TASK 6: pages/organizer/[id]/draw.js (DRAW PAGE)

**File Size:** ~340 Zeilen
**Path:** `pages/organizer/[id]/draw.js`

**Changes Needed:**

1. **Remove the Success Screen (lines 158-246)**
   - Delete entire `if (success) { ... }` block
   - This is the big congratulations page

2. **Replace with Redirect:**
   - After draw succeeds, redirect to dashboard:
   ```javascript
   if (success) {
     setSuccess(false);
     router.push(`/organizer/${id}?drawSuccess=true`);
     return null; // Don't render anything
   }
   ```

3. **Keep Everything Else:**
   - The initial draw confirmation screen (before draw) stays same
   - The "Jetzt auslosen!" button stays same
   - performDraw() function stays same

---

## 🎯 TASK 7: pages/api/draw/[groupId].js - API ENDPOINT

**File Size:** ~120 Zeilen
**Path:** `pages/api/draw/[groupId].js`

**What it needs to do:**

After successful draw, generate correct share link based on mode:

```javascript
// At the end of successful draw, BEFORE returning response:

const baseUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://wichtel-' + process.env.VERCEL_DEPLOYMENT_SUFFIX + '.vercel.app'}`;

const isMutualMode = updatedGroup.settings?.surpriseMode === 'mutual';
const isPublic = updatedGroup.settings?.pairingVisibility === 'public';

let pairingsShareLink;

if (isPublic) {
  // VAR 1 & VAR 3: Public Pairings Page
  pairingsShareLink = `${baseUrl}/${groupId}/pairings`;
} else {
  // VAR 2 & VAR 4: Private - Join Page
  pairingsShareLink = `${baseUrl}/join/${groupId}`;
}

// Return response:
return res.status(200).json({
  success: true,
  pairing: updatedGroup.pairing,
  pairingShareLink: pairingsShareLink,
  message: 'Draw completed successfully'
});
```

**Key Points:**
- Mode detection: `surpriseMode` + `pairingVisibility`
- Link must be absolute URL (not just path)
- Return in response so organizer dashboard can use it

---

## 🎯 TASK 8: TESTING ALL 4 VARIANTS

After all code changes, test each variant COMPLETELY:

### TEST CASE 1: MUTUAL + PUBLIC
- [ ] Create group → Mutual + Public
- [ ] Add participants + set wishes/surprises
- [ ] Go to draw page → Click "Auslosen"
- [ ] Should redirect to dashboard with popup
- [ ] Popup shows "Auslosung erfolgreich"
- [ ] Click "Okay" → popup closes
- [ ] Orange Link-Box shows `/[groupId]/pairings`
- [ ] Click link → Public pairings page loads
- [ ] Page shows: Titel "Hier sind die Paarungen", Budget oben, Kacheln nicht klickbar, Amazon Filter unten
- [ ] ✅ Success

### TEST CASE 2: MUTUAL + PRIVATE
- [ ] Create group → Mutual + Private
- [ ] Add participants + set wishes/surprises
- [ ] Draw → Popup → Dashboard
- [ ] Orange Link-Box shows `/join/[groupId]`
- [ ] Participant joins via link → sees TNListe
- [ ] Click own name → PIN dialog
- [ ] Enter PIN → shows detail view
- [ ] Should show: "XY wird überrascht" + "Denk dir was Schönes aus" + Budget
- [ ] NO Amazon Filter visible
- [ ] ✅ Success

### TEST CASE 3: FLEXIBLE + PUBLIC
- [ ] Create group → Flexible + Public
- [ ] Add participants + set some wishes + some surprise
- [ ] Draw → Popup → Dashboard
- [ ] Orange Link-Box shows `/[groupId]/pairings`
- [ ] Public user visits pairings page
- [ ] Page shows: Titel "Hier sind die Paarungen...", Hint "Klicke auf deinen Namen"
- [ ] Kacheln ARE clickable (cursor pointer)
- [ ] Click a card → goes to `/[groupId]/pairings/[participantId]`
- [ ] Detail page shows: "Du beschenst XY" + Budget oben
- [ ] If XY wants surprise: Shows "Überraschung!" + Amazon Filter
- [ ] If XY has wishlist: Shows wishlist + Amazon Filter
- [ ] ✅ Success

### TEST CASE 4: FLEXIBLE + PRIVATE
- [ ] Create group → Flexible + Private
- [ ] Add participants + set some wishes + some surprise
- [ ] Draw → Popup → Dashboard
- [ ] Orange Link-Box shows `/join/[groupId]`
- [ ] Participant joins → TNListe
- [ ] Click own name → PIN dialog
- [ ] Shows: "Du beschenst XY" + Budget
- [ ] If XY wants surprise: Shows "Überraschung!" message
- [ ] If XY has wishlist: Shows wishlist
- [ ] NO Amazon Filter
- [ ] Back link to TNListe works
- [ ] ✅ Success

---

## 🔧 TECHNICAL REFERENCE

### Group Settings Structure
```javascript
group.settings = {
  surpriseMode: 'mutual' | 'flexible',  // Determines VAR 1,3 vs 2,4
  pairingVisibility: 'public' | 'private',  // Determines public vs private
  budget: "20-30€",  // Display on all pages
  ...
}

group.pairing = {
  'fromId1': 'toId1',  // Who gifts to whom
  'fromId2': 'toId2',
  ...
}

group.participants = [
  {
    id: 'xyz',
    name: 'Alice',
    wantsSurprise: true/false,  // Only in Flexible mode
    giftList: [...]  // Gifts they added
  },
  ...
]
```

### URL Params
- Dashboard: `/organizer/[id]?drawSuccess=true` (trigger popup)
- Public Pairings: `/[groupId]/pairings` (no params)
- Private Pairings: `/join/[groupId]` (existing participant flow)
- Detail Page: `/[groupId]/pairings/[participantId]` (participant id who you gift to)

---

## 📝 BEFORE YOU START

Read IMPLEMENTATION_SPEC.md first (lines 1-309) for full context on all 4 variants!

This file just gives implementation details. The spec has the business logic!

---

## ✅ CHECKLIST FOR NEXT CONTEXT

Before starting implementation:
- [ ] Read IMPLEMENTATION_SPEC.md (full requirements)
- [ ] Read THIS file (implementation details)
- [ ] Understand the 4 variants completely
- [ ] Start with Task 4 (join/[groupId].js)
- [ ] Then Task 5 & 6 together
- [ ] Then Task 7
- [ ] Then Test (Task 8)
- [ ] Then Commit & Push
