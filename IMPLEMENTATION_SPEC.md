# PAIRINGS REDESIGN - IMPLEMENTATION SPECIFICATION

**Status:** In Implementierung
**Branch:** monday2
**Version:** 2.0.2
**Last Updated:** 2025-11-25

---

## 🎯 GESAMTVISION

Nach Draw-Button wird der Organisator DIREKT zum Dashboard geleitet (nicht zur Grats-Seite).
Ein grünes Success-Popup zeigt "Auslosung erfolgreich ✓ Versende den Link unten".
Der Link leitet je nach Modus auf verschiedene Pairings-Seiten.

---

## 📋 VIER PAIRINGS-VARIANTEN

### **VAR 1: MUTUAL + PUBLIC** (`/[groupId]/pairings`)
- **Wer sieht es:** Alle (öffentlich ohne PIN)
- **Layout:** Kacheln "X beschenkt Y" (NICHT klickbar)
- **Budget:** Oben drüber anzeigen
- **Amazon Filter:** Unten dran
- **Inhalte:**
  - Titel: "Hier sind die Paarungen"
  - Kacheln-Grid: "X beschenkt Y"

### **VAR 2: MUTUAL + PRIVATE** (`/join/[groupId]`)
- **Wer sieht es:** TN mit PIN
- **Layout:** TNListe (bereits vorhanden)
- **Flow:** TN klickt eigenen Namen → PIN-Abfrage → Detail-View
- **Detail-View zeigt:**
  - "XY wird überrascht"
  - Hinweis: "Denk dir was Schönes aus"
  - Budget anzeigen
- **Amazon Filter:** NICHT vorhanden

### **VAR 3: FLEXIBLE + PUBLIC** (`/[groupId]/pairings`)
- **Wer sieht es:** Alle (öffentlich ohne PIN)
- **Layout:** Kacheln "X beschenkt Y" (KLICKBAR!)
- **Budget:** Oben drüber anzeigen
- **Amazon Filter:** Unten dran
- **Klick-Flow:** Kachel → `/[groupId]/pairings/[participantId]`
- **Detail-View zeigt:**
  - "Du beschenst XY"
  - Überrascht? Oder Wunschliste?
  - Wenn Wunschliste: PIN optional für geschützte Einträge

### **VAR 4: FLEXIBLE + PRIVATE** (`/join/[groupId]`)
- **Wer sieht es:** TN mit PIN
- **Layout:** TNListe (bereits vorhanden)
- **Flow:** TN klickt eigenen Namen → PIN-Abfrage → Detail-View
- **Detail-View zeigt:**
  - "Du beschenst XY"
  - Überrascht? Oder Wunschliste?
  - Wenn Wunschliste: Volle Liste sichtbar (PIN bereits eingegeben)

---

## 🗂️ DATEIEN & IMPLEMENTIERUNGSCHECKLIST

### **1️⃣ pages/organizer/[id].js** ← HAUPTDASHBOARD
**Status:** ⚠️ MUSS ANGEPASST WERDEN

**Änderungen:**
- [ ] Nach Draw: Nicht zur `/organizer/[id]/draw` seite sondern direkt zu Dashboard
- [ ] Success-Popup anzeigen: "Auslosung erfolgreich ✓"
- [ ] Text: "Versende den Link unten"
- [ ] Orange Link-Box weiterhin vorhanden (bereits im Code)
- [ ] Link muss je nach Modus korrekt generiert sein (siehe API-Punkt)

**Zeilen:**
- Popup-State: `useState` hinzufügen für `showDrawSuccess`
- Render-Logic: Nach Draw-Return zeige Popup

---

### **2️⃣ pages/organizer/[id]/draw.js** ← DRAW-SEITE
**Status:** ⚠️ MUSS ANGEPASST WERDEN

**Änderungen:**
- [ ] Nach erfolgreichem Draw: Nicht Success-Meldung zeigen
- [ ] Redirect zu `/organizer/[id]?drawSuccess=true` (mit Query-Param)
- [ ] Organizer Dashboard empfängt Param und zeigt Popup

---

### **3️⃣ pages/[groupId]/pairings.js** ← MUTUAL+PUBLIC & FLEXIBLE+PUBLIC
**Status:** ⚠️ KOMPLETT ÜBERARBEITEN

**Funktionalität:**
- [ ] Check: Is Public? If not → Error
- [ ] Check: Is drawn? If not → Error
- [ ] Load pairings from `groupData.pairing` ✅ (bereits gefixt)
- [ ] Construct pairingList Array
- [ ] Render unterschiedlich je nach Mode:

**VAR 1: MUTUAL+PUBLIC**
```jsx
- Titel: "Hier sind die Paarungen"
- Budget oben anzeigen
- Kachel-Grid: {fromName} beschenkt {toName}
- Nicht klickbar
- Amazon Filter unten
```

**VAR 3: FLEXIBLE+PUBLIC**
```jsx
- Titel: "Hier sind die Paarungen - klicke auf deinen Namen"
- Budget oben anzeigen
- Kachel-Grid: {fromName} beschenkt {toName} (KLICKBAR!)
- onClick → Router.push(`/[groupId]/pairings/${fromId}`)
- Amazon Filter unten
```

**Code-Structure:**
```javascript
const isMutualMode = group?.settings?.surpriseMode === 'mutual';
const isFlexibleMode = group?.settings?.surpriseMode === 'flexible';

if (isMutualMode) {
  // VAR 1 Layout
} else if (isFlexibleMode) {
  // VAR 3 Layout
}
```

---

### **4️⃣ pages/[groupId]/pairings/[participantId].js** ← FLEXIBLE-MODE DETAIL
**Status:** ✅ TEILWEISE VORHANDEN (muss angepasst werden)

**Funktionalität:**
- [ ] Nur für Flexible+Public nutzbar (VAR 3)
- [ ] Check: Is Public & Is Flexible? If not → Error
- [ ] Load participant details
- [ ] Titel: "Du beschenst {partnerName}"
- [ ] Wunschliste laden (falls vorhanden)
- [ ] PIN-Handling für geschützte Wünsche
- [ ] Budget anzeigen
- [ ] Amazon Filter: JA (unten)

**Code wird bereits teilweise vorhanden sein, muss aber geklärt werden ob VAR 3 oder VAR 4**

---

### **5️⃣ pages/join/[groupId].js** ← PRIVATE MODI EINSTIEGSPUNKT
**Status:** ⚠️ MUSS ERWEITERT WERDEN

**Funktionalität für VAR 2 & VAR 4:**
- [ ] Nach PIN-Eingabe: TNListe zeigen
- [ ] TN klickt auf sich selbst → `/join/[groupId]?participantId={id}`
- [ ] Zeige Detail-View:

**VAR 2: MUTUAL+PRIVATE**
```jsx
- "XY wird überrascht"
- "Denk dir was Schönes aus"
- Budget anzeigen
- KEIN Amazon Filter
```

**VAR 4: FLEXIBLE+PRIVATE**
```jsx
- "Du beschenst XY"
- Überrascht? Oder Wunschliste?
- Budget anzeigen
- Wunschliste falls vorhanden
- KEIN Amazon Filter
```

---

### **6️⃣ pages/api/draw/[groupId].js** ← DRAW-API
**Status:** ⚠️ MUSS ANGEPASST WERDEN

**Änderungen:**
- [ ] Nach Draw: Generiere correct share link basierend auf Modus
- [ ] Speichere Link in `group.pairingsShareLink`
- [ ] Link-Format:
  - VAR 1 & 3 (Public): `https://wichtel.../[groupId]/pairings`
  - VAR 2 & 4 (Private): `https://wichtel.../join/[groupId]`

**Relevanter Code:**
- Zeile ~50-120: Draw-Logic, danach Link generieren
- Link speichern in Group-Object

---

## 🔗 LINK-SHARING BOX (Organizer Dashboard)

**Bereits vorhanden in pages/organizer/[id].js:**
- Lines 801-820: Orange Link-Box
- Zeigt: `pairingsShareText` Variable

**Was muss sich ändern:**
- [ ] `pairingsShareText` muss korrekt basierend auf Modus erzeugt werden
- [ ] Text unterscheidet sich zwischen VAR 1/2/3/4:

**VAR 1/3 (PUBLIC):**
```
Link: https://wichtel.../[groupId]/pairings
Text: "Teile diesen Link mit allen Teilnehmern um Paarungen zu sehen"
```

**VAR 2/4 (PRIVATE):**
```
Link: https://wichtel.../join/[groupId]
Text: "Teile diesen Link mit allen Teilnehmern"
```

---

## 🎨 DESIGN-KOMPONENTEN

### **Kachel-Layout (VAR 1 & 3)**
```jsx
<div className="card hover:shadow-lg transition">
  <div className="text-center">
    <p className="text-xl font-semibold text-gray-800">
      {fromName}
    </p>
    <p className="text-3xl my-3">🎁</p>
    <p className="text-gray-600">beschenkt</p>
    <p className="text-xl font-semibold text-red-600 mt-2">
      {toName}
    </p>
  </div>
</div>
```

### **Budget-Anzeige (Oben auf Seite)**
```jsx
<div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 mb-6">
  <h3 className="section-title">💰 Budget</h3>
  <p className="text-lg font-semibold text-gray-800">
    {group.settings?.budget || "Nicht angegeben"}
  </p>
</div>
```

### **Amazon Filter (Unten auf VAR 1 & 3)**
```jsx
<div className="mt-8 pt-8 border-t-2 border-gray-200">
  <h3 className="section-title">Geschenkideen auf Amazon</h3>
  <AmazonFilterSelector budget={group.settings?.budget} />
</div>
```

---

## ✅ TESTING CHECKLIST

Nach Implementierung ALLE 4 Szenarien testen:

- [ ] **VAR 1 - Mutual+Public:**
  - Create Group → Mutual + Public
  - Draw → Share Link → Öffne Link → Sehe Kacheln, nicht klickbar, Budget oben, Amazon unten

- [ ] **VAR 2 - Mutual+Private:**
  - Create Group → Mutual + Private
  - Draw → Share Link → Participant joined → Sehe TNListe → Klick selbst → Detail View "überrascht"

- [ ] **VAR 3 - Flexible+Public:**
  - Create Group → Flexible + Public
  - Draw → Share Link → Öffne Link → Sehe Kacheln, KLICKBAR, Budget oben, Amazon unten → Klick → Detail "Du beschenst", Wunschliste

- [ ] **VAR 4 - Flexible+Private:**
  - Create Group → Flexible + Private
  - Draw → Share Link → Participant joined → Sehe TNListe → Klick selbst → Detail View "Du beschenst" + Wunschliste

---

## 🔧 TECHNISCHE DETAILS

### Group Object Structure
```javascript
group = {
  settings: {
    surpriseMode: 'mutual' | 'flexible',  // Determines VAR 1,3 vs 2,4
    pairingVisibility: 'public' | 'private'  // Determines public vs private
  },
  pairing: {
    'participantId1': 'participantId2',  // Map wer wen beschenkt
    ...
  },
  participants: [
    { id, name, wantsSurprise, giftList: [] },
    ...
  ],
  budget: "20-30€",
  drawn: true/false
}
```

### API Response nach Draw
```javascript
POST /api/draw/[groupId]
Response: {
  success: true,
  pairingShareLink: "https://...",  // Mode-dependent
  message: "Draw successful"
}
```

---

## 📝 STATUS: PARTIALLY COMPLETED

### ✅ COMPLETED TASKS:
1. **Task 2 - pages/[groupId]/pairings.js** ✅
   - Refactored für VAR 1 (Mutual+Public) & VAR 3 (Flexible+Public)
   - Kachel-Layout implementiert
   - Budget Anzeige oben hinzugefügt
   - Amazon Filter unten hinzugefügt
   - isMutualMode & isFlexibleMode Logic hinzugefügt
   - Klick-Handler für VAR 3 implementiert

### ⏳ PENDING TASKS (PRIORITÄT):
3. **Task 3 - pages/[groupId]/pairings/[participantId].js** (VAR 3 ONLY)
   - Nur für Flexible+Public (VAR 3) relevant
   - Zeigt "Du beschenst [fromId]" Partner's Wunschliste
   - Diese Datei ist bereits VORHANDEN - muss NUR angepasst werden
   - Amazon Filter unten hinzufügen (ist bereits da)
   - Budget anzeigen (ist bereits da)
   - Titel korrigieren von "{partner.name}s Profil" zu "Du beschenst {partner.name}"

4. **Task 4 - pages/join/[groupId].js** (VAR 2 & VAR 4)
   - VAR 2 (Mutual+Private): TN klickt sich selbst → sieht "XY wird überrascht"
   - VAR 4 (Flexible+Private): TN klickt sich selbst → sieht "Du beschenks XY" + Wunschliste
   - Diese Datei ist KOMPLEX - enthält TNListe und Detail-Views
   - KEINE Amazon Filter für Private Modi (VAR 2 & 4)

5. **Task 5 - pages/organizer/[id].js** (ORGANIZER DASHBOARD)
   - Nach Draw: Nicht zur `/organizer/[id]/draw` sondern direkt zu Dashboard
   - Success-Popup: "Auslosung erfolgreich ✓ Versende den Link unten"
   - Orange Link-Box ist bereits vorhanden (lines 801-820)
   - Redirect-Logic: draw.js → POST → /organizer/[id]?drawSuccess=true
   - Dashboard zeigt Popup wenn URL-Param drawSuccess=true

6. **Task 6 - pages/organizer/[id]/draw.js** (DRAW PAGE)
   - Nach erfolgreichem Draw: Nicht Success-Seite zeigen
   - Stattdessen: Router.push(`/organizer/${id}?drawSuccess=true`)
   - Entferne die große Congratulations-Seite (lines 158-246)

7. **Task 7 - pages/api/draw/[groupId].js** (DRAW API)
   - Nach Draw: Generiere correct share link basierend auf Modus
   - VAR 1 & 3 (Public): Link = `/[groupId]/pairings`
   - VAR 2 & 4 (Private): Link = `/join/[groupId]`
   - Return: { success: true, pairingShareLink: "...", pairing: {...} }

---

## 🎯 NÄCHSTER CONTEXT - EXAKTE TODO-REIHENFOLGE:

**WENN DU DIESEN CONTEXT LIEST, FOLGE DIESER REIHENFOLGE:**

```
1. Starte mit Task 3: Adjust /[groupId]/pairings/[participantId].js
   - Nur Titel korrigieren + Budget anzeige checken
   - File ist bei ~268 Zeilen

2. Dann Task 4: Refactor /join/[groupId].js
   - Größte/komplexeste Datei
   - Muss VAR 2 & VAR 4 logik hinzufügen
   - KEINE Amazon Filter

3. Dann Task 5 & 6 zusammen: organizer Dashboard & Draw-Page
   - 5: Add Popup to dashboard + URL-Param handling
   - 6: Remove grats-page from draw.js, add redirect

4. Dann Task 7: Update /api/draw/[groupId].js
   - Mode-aware link generierung
   - Return correct URL basierend auf surpriseMode + pairingVisibility

5. Test alle 4 Varianten
6. Commit & Push
```

---

## 📝 NOTIZEN FÜR NÄCHSTE KONTEXT

Diese Datei enthält ALLES was nötig ist:
- Welche 4 Varianten es gibt und ihre genauen Anforderungen
- Welche Dateien zu ändern sind
- Link-Generierung basierend auf Modus
- Design-Komponenten
- Testing-Plan
- IMPLEMENTATION_SPEC.md = SINGLE SOURCE OF TRUTH für alle Anforderungen

**Nächster Context kann direkt mit Task 3 starten!**
