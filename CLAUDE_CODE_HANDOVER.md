# 🎁 Wichtel App - Claude Code Übergabeanweisung

## Projektübersicht

**Wichtel** ist eine Online-Geschenkziehungs-App für Secret-Santa-Tauschgruppen (Wichtelgruppen). Die App verwaltet Gruppen, führt geheime Auslosungen durch und ermöglicht es Teilnehmern, Wunschlisten zu erstellen.

**Technologie:**
- Next.js 14
- React Hooks (useState, useEffect, useRef)
- Tailwind CSS
- KV-Store (Redis) für Datenpersistenz
- localStorage für Client-seitige Persistenz

---

## Kern-Konzepte

### 1. Gruppe (Group)
Eine Wichtelgruppe besteht aus:
```javascript
{
  id: string,                    // Eindeutige Gruppen-ID
  name: string,                  // Gruppenname
  budget: string,                // "10€", "15€", etc.
  drawn: boolean,                // false=vor Auslosung, true=nach Auslosung
  participants: [
    {
      id: string,
      name: string,
      wantsSurprise: boolean,    // true=keine Liste, false=mit Liste
      assignedTo: string,        // ID von wem dieser Person ein Geschenk zugelost wurde (nach draw)
      giftedTo: string           // ID wem diese Person ein Geschenk kaufen muss (nach draw)
    }
  ],
  organizer: { id, name },
  exclusions: {},                // { "fromId-toId": true } - Person fromId will nicht für toId kaufen
  gifts: { participantId: [...] }
}
```

### 2. PIN-System - KRITISCH!

**PIN ist erforderlich und hat folgende Anforderungen:**

#### Erstellung:
- **Wann:** Nur NACH der Wunschliste (Step 4.5)
- **Format:** 4-6 Ziffern, nur Zahlen (0-9)
- **Speicherort:** KV-Store (`pin_${participantId}`)
- **Client-seitig:** localStorage (`pin_${participantId}`)

#### Verifizierung:
- **Wann:** Beim Öffnen eines Post-Draw-Links (nach `group.drawn === true`)
- **Ablauf:**
  1. PIN-Input-Dialog zeigen
  2. PIN gegen gespeicherte PIN prüfen
  3. Bei Erfolg: `pinConfirmed = true` setzen
  4. Zugriff auf Post-Draw-Seite erlauben
- **Fehlerbehandlung:** Max 3 Versuche, dann Warnung

#### Speicherung nach Erstellung:
```javascript
// POST /api/gifts/{groupId}
{
  participantId: string,
  pin: string              // 4-6 Ziffern
}
```

#### Verifizierung beim Link-Klick:
```javascript
// GET /api/groups/list?groupId={groupId}
// Vergleiche eingegeben PIN mit: localStorage(`pin_${participantId}`)
// Oder: KV-Store (`pin_${participantId}`)
```

---

## Flow-Diagramme

### Flow VOR der Auslosung (`group.drawn === false`)

```
Step 1: Teilnehmerliste
  ↓ [Auf eigenen Namen klicken]
Step 1.5: Gift Choice (Wunschliste oder Überraschung?)
  ├─ [Wunschliste erstellen] → Step 2
  └─ [Überrascht werden] → Step 3

Step 2: Geschenkeliste erstellen (GiftList.js Component)
  - Amazon Filter zur Produktsuche
  - Bis zu 10 Geschenke hinzufügen
  - Name + Link pro Geschenk
  ↓ [Weiter]

Step 3: Ausschlüsse (optional)
  - Max. 1 Person ausschließen (z.B. Partner)
  - "Ich will dieser Person kein Geschenk kaufen"
  ↓ [Weiter]

Step 4.5: PIN erstellen (MANDATORY)
  - PIN Input (4-6 Ziffern)
  - PIN speichern in KV + localStorage
  - Bestätigung erforderlich zum Abschluss
  ↓ [Fertig]

[Organizer führt Draw durch]
```

### Flow NACH der Auslosung (`group.drawn === true`)

```
Link-Klick: /join/{groupId}
  ↓ [Erste Frage: "Wer bin ich?"]

Step 1: Teilnehmerliste (IMMER!)
  - Alle Teilnehmer anzeigen
  ↓ [Auf Namen klicken]

PIN-Dialog: "Gib deine PIN ein"
  - 4-6 Ziffern eingeben
  - Vergleich mit gespeicherter PIN
  ↓ [PIN korrekt]

Step 4: Geschenk-Ideen anzeigen (read-only)
  - Wunschliste der zugelosteten Person anzeigen
  - Amazon-Links klickbar
  - KEINE Änderungen möglich
```

---

## Wichtige Dateien & Funktionen

### `/pages/join/[groupId].js` - HAUPTDATEI
**1800+ Zeilen** - Verwaltet den gesamten Participant-Flow

#### Kritische useEffects:

**loadGroup() - Lines 130-215:**
```javascript
// 1. Lädt Gruppe von KV
// 2. Checkt localStorage für participant_${groupId}
// 3. WICHTIG: Setzt Step basierend auf group.drawn Status:
//    - Wenn group.drawn === true: setStep(1) [Teilnehmerliste]
//    - Wenn group.drawn === false: setStep(1.5) [Gift Choice]
// 4. Lädt Geschenke des Teilnehmers
// 5. Setzt pinConfirmed nur wenn group.drawn === true
```

**useEffect für Geschenke - Lines 216-240:**
```javascript
// Laden der Geschenke bei Step 2
// Nur wenn !group.drawn
// Speichert in currentGifts state
```

#### State-Variablen:
```javascript
const [step, setStep] = useState(1);           // Aktueller UI-Step
const [selectedParticipant, setSelectedParticipant] = useState(null);
const [group, setGroup] = useState(null);
const [currentGifts, setCurrentGifts] = useState([]);
const [pinConfirmed, setPinConfirmed] = useState(false);
const [wantsSurprise, setWantsSurprise] = useState(false);
const [exclusions, setExclusions] = useState({});
const [tempPin, setTempPin] = useState('');    // PIN Input vor Speicherung
```

#### Konditionelle Rendering:
- **Step 1:** Teilnehmerliste (beide vorher/nachher)
- **Step 1.5:** Wunschliste oder Überraschung? (nur VOR Draw)
- **Step 2:** Geschenkeliste erstellen (nur VOR Draw, wenn `!wantsSurprise`)
- **Step 3:** Ausschlüsse (nur VOR Draw)
- **Step 4.5:** PIN erstellen (nur VOR Draw, nach Step 3)
- **Step 4:** Geschenk-Details anzeigen (nur NACH Draw, mit `pinConfirmed === true`)

### `/components/GiftList.js` - Geschenkelisten-Editor
**~480 Zeilen** - Nur für Step 2 (Wunschliste-Erstellung)

**Features:**
- Amazon-Filter (Kategorie, Alter, Geschlecht, Budget)
- Geschenk-Modal zur Link-Eingabe
- Bis zu 10 Geschenke pro Teilnehmer
- ~~Floating Box mit 1-10 Counter~~ (ENTFERNT in commit 32baff4)

**Props:**
```javascript
<GiftList
  groupId={groupId}
  participantId={selectedParticipant.id}
  onComplete={() => setStep(3)}
  maxGifts={10}
  readonly={false}  // true NACH Draw
/>
```

### `/pages/organizer/[id]/draw.js` - Auslosungs-Logik
**Draw-Algorithmus:**
1. Lädt alle Teilnehmer + ihre Ausschlüsse
2. Generiert Random-Zulosung (kein Teilnehmer für sich selbst)
3. Respektiert exclusions-Regeln
4. Speichert `assignedTo` (wer bekommt von mir ein Geschenk) und `giftedTo` (wem kaufe ich)
5. Setzt `group.drawn = true` in KV

### `/api/groups/list` - Haupt-API-Endpoint

**GET /api/groups/list?groupId={id}:**
```javascript
// Lädt Gruppe aus KV
// Gibt vollständige Group-Daten zurück
// POST: Speichert Änderungen in KV
```

**POST /api/groups/list - Erwartet:**
```javascript
{
  groupId: string,
  participants: Array,
  drawn: boolean,
  exclusions: Object,
  // ... weitere Felder
}
```

---

## Kritische User Stories & Validierungen

### Story 1: Teilnehmer erstellt Wunschliste VOR Draw
```
1. Link /join/{groupId} öffnen
2. Auf eigenen Namen klicken
3. "Wunschliste erstellen" wählen
4. Bis zu 10 Artikel mit Links hinzufügen (GiftList.js)
5. Weiter → Ausschlüsse (Step 3)
6. Weiter → PIN erstellen (Step 4.5)
   - PIN: 4-6 Ziffern, nur Zahlen
   - Speichern in KV + localStorage
7. Fertig

VALIDIERUNG:
- Mindestens 1 Geschenk erforderlich (showNoGiftsDialog)
- PIN Format korrekt
- PIN in KV gespeichert
```

### Story 2: Organizer führt Draw durch
```
1. Dashboard öffnen
2. "Auslosung durchführen" klicken
3. Draw-Seite: /organizer/{id}/draw
4. [Auslosung starten] klicken
5. group.drawn = true in KV
6. Alle Teilnehmer haben now assignedTo + giftedTo

VALIDIERUNG:
- Alle Teilnehmer haben Wunschliste (außer wantsSurprise)
- Kein Teilnehmer für sich selbst
- Ausschlüsse respektiert
```

### Story 3: Teilnehmer schaut Geschenk NACH Draw
```
1. Draw-Link /join/{groupId} erhalten (POST)
2. Link öffnen
3. Step 1: Teilnehmerliste anzeigen
   - Auto-Navigation: setStep(1) [NICHT Step 1.5]
4. Auf Empfänger-Namen klicken
5. PIN-Dialog: PIN eingeben
6. PIN verifizieren gegen localStorage/KV
7. Step 4: Geschenk-Infos anzeigen (read-only)
8. Amazon-Links verfügbar

VALIDIERUNG:
- PIN korrekt
- Nur read-only Zugriff
- Nur auf zugelostete Person limitiert
```

---

## Best Practices & Grenzen

### localStorage-Verwendung
```javascript
// Speichert Teilnehmer-Auswahl:
localStorage.setItem(`participant_${groupId}`, participantId);
localStorage.getItem(`participant_${groupId}`);

// Speichert PIN (alternativ zu KV):
localStorage.setItem(`pin_${participantId}`, pin);
```

### KV-Store Schlüssel
```javascript
`group_${groupId}`           // Hauptgruppen-Daten
`gifts_${groupId}_${participantId}`  // Geschenke
`pin_${participantId}`       // PIN-Speicherung
`exclusions_${groupId}`      // Ausschlüsse
```

### Conditional Rendering Logik
```javascript
// VOR Draw: Step 1.5, 2, 3, 4.5 möglich
if (!group.drawn) {
  // Bearbeitung erlaubt
}

// NACH Draw: Nur Step 1 + 4 mit PIN
if (group.drawn) {
  // Nur read-only Zugriff mit PIN-Verifizierung
}
```

### Error Handling
- `showNoGiftsDialog`: Zeigt Dialog wenn Teilnehmer weiter will ohne Geschenke (Step 2)
- PIN-Fehler: Zeigt Fehler für 3 Sekunden (`setTimeout(() => setError(''), 3000)`)
- Netzwerk-Fehler: Try-catch in API-Calls

---

## Häufige Fehler & Fixes

| Problem | Ursache | Lösung |
|---------|--------|--------|
| Step 1.5 nach Draw | `group.drawn` nicht geprüft | In `loadGroup()` useEffect `drawn` checken |
| PIN nicht gespeichert | Falsche API POST | `/api/gifts/{groupId}` mit PIN-Feld |
| Geschenke nach Draw editierbar | readonly nicht gesetzt | `<GiftList readonly={group.drawn} />` |
| localStorage wird gelöscht | Falscher Key | `participant_${groupId}` verwenden |
| AmazonFilterSelector error | Import fehlt | `import AmazonFilterSelector from '../../components/AmazonFilterSelector'` |

---

## Testing-Szenarien

### Szenario A: Kompletter Flow vor Draw
```
1. Gruppen-ID: abc123
2. Organizer: Anna
3. Teilnehmer: Ben, Clara, David

Schritt-für-Schritt:
1. /join/abc123 → Ben klickt
2. Step 1 → Ben wählt aus
3. Step 1.5 → "Wunschliste erstellen"
4. Step 2 → 3 Geschenke hinzufügen (GiftList)
5. Step 3 → Clara ausschließen
6. Step 4.5 → PIN "1234" setzen
7. localStorage hat `participant_abc123 = Ben` + `pin_Ben = 1234`
8. KV hat Geschenke + PIN
```

### Szenario B: Kompletter Flow nach Draw
```
1. Organizer führt draw durch
   - group.drawn = true
   - Ben → giftedTo: David (Ben kauft für David)
   - David → giftedTo: Clara
   - Clara → giftedTo: Ben

2. Ben klickt Draw-Link /join/abc123
3. Step 1: Liste anzeigen (NICHT Step 1.5!)
4. Ben klickt auf "David"
5. PIN-Dialog: Ben gibt "1234" ein
6. PIN korrekt → Step 4 (read-only)
7. Davids Wunschliste anzeigen
8. Amazon-Links funktionieren
```

---

## Deployment & Branches

**Branching-Strategie:**
- `main`: Production
- `sunday-blues-{number}`: Feature/Fix Branches
- `wichtel-beta`: Testing Branch

**Commits müssen enthalten:**
```
[Feature/Fix/Refactor]: Kurze Beschreibung

Detaillierte Erklärung der Änderung.

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Kontakt & Dokumentation

**Hauptentwickler:** RadDWB
**GitHub:** https://github.com/RadDWB/wichtel-app
**Notizen:** Siehe `.claude/` für Session-Logs

---

## Quick Reference - Commands

```bash
# Entwicklung
npm run dev              # Starten auf localhost:3000
npm run build            # Production-Build
npm run lint             # Code-Linting

# Git
git checkout -b sunday-blues-{N}  # Neuer Feature Branch
git push origin sunday-blues-{N}  # Push Branch
git commit -m "..."               # Commit mit Nachricht

# Testing
# Öffne http://localhost:3000/setup → Neue Gruppe erstellen
# Nutze /join/{groupId} zum Testen des Flows
```

---

**Letzte Aktualisierung:** 23. November 2025
**Version:** 2.0 (mit PIN-Anforderungen und Flow-Details)
