# 🚀 START HERE - Next Context Instructions

**Current Branch:** monday2
**Current Version:** 2.0.2
**Status:** Tasks 1-3 Complete, Ready for Tasks 4-8

---

## 📚 DOKUMENTATION LESEN (in dieser Reihenfolge)

1. **IMPLEMENTATION_SPEC.md** - Das Basis-Dokument mit allen 4 Varianten
2. **TASK_4_TO_8_DETAILED.md** - Technische Details für die nächsten Tasks
3. **Dieses Dokument** - Überblick & Checkliste

---

## ✅ WAS IST BEREITS FERTIG?

### Task 1: Planning & Spec ✅
- IMPLEMENTATION_SPEC.md erstellt
- Alle 4 Varianten dokumentiert
- Technische Architektur geplant

### Task 2: /[groupId]/pairings.js ✅
- Refactored für VAR 1 (Mutual+Public) & VAR 3 (Flexible+Public)
- Kachel-Layout mit 3er-Grid
- Budget-Box oben hinzugefügt
- Amazon Filter unten hinzugefügt
- isMutualMode & isFlexibleMode Logic
- Klick-Handler für Flexible Mode (geht zu `/pairings/[participantId]`)

### Task 3: /[groupId]/pairings/[participantId].js ✅
- Titel korrigiert: "Du beschenst {partner.name}"
- Budget-Box oben angezeigt
- Ready für VAR 3 (Flexible+Public)

---

## 📋 NÄCHSTE TASKS (4-8)

### Task 4: pages/join/[groupId].js
**Größte Datei (1709 Zeilen) - VAR 2 & VAR 4 (Private Modi)**
- VAR 2: Mutual+Private → Zeigt "XY wird überrascht"
- VAR 4: Flexible+Private → Zeigt "Du beschenst XY" + optional Wunschliste
- Detail in: TASK_4_TO_8_DETAILED.md

### Task 5: pages/organizer/[id].js
**Dashboard - Add Success Popup nach Draw**
- Add state: showDrawSuccess
- Listen for URL param: ?drawSuccess=true
- Render Modal/Popup: "Auslosung erfolgreich ✓"
- Orange Link-Box ist bereits da (lines 801-820)
- Detail in: TASK_4_TO_8_DETAILED.md

### Task 6: pages/organizer/[id]/draw.js
**Draw Page - Remove Grats, Add Redirect**
- Remove big success screen (lines 158-246)
- Add redirect: router.push(`/organizer/${id}?drawSuccess=true`)
- Detail in: TASK_4_TO_8_DETAILED.md

### Task 7: pages/api/draw/[groupId].js
**API - Generate Mode-Aware Share Links**
- After draw success: generate link based on surpriseMode + pairingVisibility
- VAR 1 & 3 (Public): `/[groupId]/pairings`
- VAR 2 & 4 (Private): `/join/[groupId]`
- Detail in: TASK_4_TO_8_DETAILED.md

### Task 8: Testing
**Test all 4 variants end-to-end**
- Test Case 1: Mutual+Public
- Test Case 2: Mutual+Private
- Test Case 3: Flexible+Public
- Test Case 4: Flexible+Private
- Detail in: TASK_4_TO_8_DETAILED.md

---

## 🎯 IMPLEMENTIERUNGS-REIHENFOLGE (FÜR NÄCHSTEN CONTEXT)

```
START HIER →

1. Lese IMPLEMENTATION_SPEC.md ganz (Zeile 1-309)
2. Lese TASK_4_TO_8_DETAILED.md ganz
3. Starte Task 4: pages/join/[groupId].js
   - Größte Datei, aber folge dem Spec
   - VAR 2 & VAR 4 Logic hinzufügen

4. Dann Task 5: pages/organizer/[id].js
   - Add showDrawSuccess state
   - Add URL param handling
   - Add Popup Modal

5. Dann Task 6: pages/organizer/[id]/draw.js
   - Remove grats screen
   - Add redirect

6. Dann Task 7: pages/api/draw/[groupId].js
   - Mode-aware link generation

7. Dann Task 8: Test all 4 variants
   - Follow test cases in TASK_4_TO_8_DETAILED.md

8. Commit & Push

FERTIG! ✅
```

---

## 💾 FILES CREATED FOR NEXT CONTEXT

These files contain ALL information needed:

1. **IMPLEMENTATION_SPEC.md** (394 lines)
   - Business requirements for all 4 variants
   - Design components
   - Testing checklist
   - GROUP OBJECT STRUCTURE
   - URL ROUTING

2. **TASK_4_TO_8_DETAILED.md** (267 lines)
   - Technical implementation details
   - Code snippets for each task
   - URL structure
   - Testing checklist per variant

3. **This file** (NEXT_CONTEXT_START_HERE.md)
   - Overview
   - Checklist
   - Sequence

---

## 🔑 KEY CONCEPT REMINDER

```
4 VARIANTEN - 4 VERSCHIEDENE USER FLOWS:

VAR 1: MUTUAL + PUBLIC
  └─ Everyone sees pairings (no PIN)
  └─ /[groupId]/pairings
  └─ Cards NOT clickable
  └─ Amazon Filter: YES

VAR 2: MUTUAL + PRIVATE
  └─ Participant joins with PIN
  └─ /join/[groupId]
  └─ Sees TNListe → Click self → Detail "XY wird überrascht"
  └─ Amazon Filter: NO

VAR 3: FLEXIBLE + PUBLIC
  └─ Everyone sees pairings (no PIN)
  └─ /[groupId]/pairings
  └─ Cards ARE clickable → /[groupId]/pairings/[participantId]
  └─ Amazon Filter: YES

VAR 4: FLEXIBLE + PRIVATE
  └─ Participant joins with PIN
  └─ /join/[groupId]
  └─ Sees TNListe → Click self → Detail "Du beschenst XY" + Wunschliste
  └─ Amazon Filter: NO

ORGANIZER AFTER DRAW:
  Old: Draw → Grats Page → Back to Dashboard
  New: Draw → Success Popup on Dashboard → Share Link
```

---

## ⚠️ WICHTIGE PUNKTE

1. **KEINE Weiß ist Grundlage** - Alles muss in IMPLEMENTATION_SPEC.md stehen
2. **Alte Grats-Seite entfernen** - Wird durch Popup ersetzt
3. **Link-Generierung im API** - Muss basierend auf Mode unterschiedliche URLs generieren
4. **Amazon Filter NUR für Public** - VAR 2 & 4 KEINE Filter
5. **All 4 Variants testen** - ALLE müssen funktionieren

---

## 📝 BRANCH & VERSION INFO

- **Branch:** monday2
- **Version:** 2.0.2
- **Last Commit:** a37cfc5 (isMutualMode + pairing field fixes)
- **Working Directory:** c:\Users\rad3\OneDrive\Dokumente\GithubNew\StrichlisteRepo\StrichlisteChat\wichtel-app

Nach Tasks 4-8 committed und gepushed → neue Version (2.0.3) ?

---

## 🎯 SUCCESS CRITERIA

Wenn du fertig bist, sollte dieser Zustand erreicht sein:

- [ ] Task 4 (join/[groupId].js) implementiert & getestet
- [ ] Task 5 (organizer dashboard) implementiert & getestet
- [ ] Task 6 (draw page) implementiert & getestet
- [ ] Task 7 (draw API) implementiert & getestet
- [ ] Alle 4 Varianten end-to-end getestet
- [ ] Kein Browser-Fehler
- [ ] Alle Links funktionieren
- [ ] Popup auf Dashboard zeigt sich
- [ ] Richtige Links je nach Mode werden generiert
- [ ] Committed & gepusht

---

**Ready? Go ahead with Task 4! 🚀**
