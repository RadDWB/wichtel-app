# 🎁 Wichtel Online - Kompletter Workflow

## Übersicht

Eine **Wichtelgruppe** läuft in 4 Phasen ab:

1. **Phase 1: Gruppe erstellen** (Organisator) → Organisator-Dashboard
2. **Phase 2: Teilnehmer beitreten & Geschenkeliste eintragen** (Alle Teilnehmer)
3. **Phase 3: Auslosen** (Organisator) → Jeder sieht seinen Wichtel-Partner
4. **Phase 4: Geschenkeliste des Partners anschauen** (Alle Teilnehmer)

---

## Phase 1: Gruppe Erstellen (Organisator)

### Schritt 1.1: Setup starten
1. Gehe zur Startseite: https://julklapp-online.vercel.app/
2. Klick auf "✅ Neue Wichtelgruppe anlegen"
3. Folge dem 6-Schritte-Wizard:
   - **Schritt 1**: Anlass wählen (Weihnachten, Geburtstag, etc.)
   - **Schritt 2**: Gruppennamen & Enddatum festlegen
   - **Schritt 3**: Dein Name & Email eingeben
     - Optional: "Ich möchte auch am Wichteln teilnehmen" ✅
   - **Schritt 4**: Teilnehmer einladen (Namen + optional Email)
   - **Schritt 5**: Budget festlegen (z.B. 30€)
   - **Schritt 6**: Einladungstext schreiben

### Schritt 1.2: Organisator-Dashboard
Nach der Erstellung wirst du automatisch zum **Organisator-Dashboard** weitergeleitet.

Hier siehst du:
- 🔗 **Dein Organisations-Link** (um jederzeit den Überblick zu behalten)
- 📧 **"Per Email senden"** Button
  - Öffnet dein lokales Email-Programm
  - Mit vorgefülltem Link zur deinem Dashboard
  - Du kannst die Email an dich selbst senden zum Bookmarken

**💡 Tipp:** Speichere den Link als **Lesezeichen** (Strg+D / Cmd+D), damit du schnell zurückkommen kannst!

---

## Phase 2: Teilnehmer Beitreten & Geschenkelisten

### Schritt 2.1: Teilnehmer-Link teilen
Der Organisator erhält einen **Teilnehmer-Link** auf dem Dashboard:
- Format: `https://julklapp-online.vercel.app/join/[GRUPPE_ID]`
- Teile diesen Link mit allen Teilnehmern (Email, WhatsApp, etc.)

### Schritt 2.2: Teilnehmer beitreten
Jeder Teilnehmer:
1. Klickt auf den Link `/join/[GRUPPE_ID]`
2. Wählt seinen Namen aus der Liste (oder gibt ihn neu ein)
3. Bestätigt seinen Namen
4. **Schritt 3: Exclusions** - Wählt aus, wem man NICHT geschenkt bekommen möchte
   - Beispiel: "Ich möchte nicht von meinem Partner XXX auslosen werden"
   - Max. Ausschlüsse: 1-2 (je nach Gruppengröße)
5. Bestätigt die Exclusions → Geht zu Schritt 4

### Schritt 2.3: Geschenkeliste eintragen
Jeder Teilnehmer trägt seine Wunschliste ein.

**Option A: Amazon-Produkte manuell hinzufügen** (Empfohlen!)

1️⃣ Gehe auf [amazon.de](https://amazon.de)
2️⃣ Suche dein Wunschprodukt (Nutze Filter um Preis auf Budget zu begrenzen)
3️⃣ Kopiere den Link aus der Adresszeile
   - Beispiel: `https://amazon.de/dp/B08N5WRWNW`
4️⃣ **Im Formular:**
   - Paste den Link in das Feld "🔗 Kopiere den Link unten ein"
   - Gib einen aussagekräftigen Namen ein (z.B. "AirPods Pro")
   - Klick "✨ Geschenk hinzufügen"

**Option B: Amazon-Produktsuche verwenden** (Automatische Vorschläge)
- "🎯 Geschenkideen durchstöbern" Button
- Wähle Kategorie, Geschlecht, Budget
- App schlägt echte Amazon-Produkte vor
- Klick "✅ Zur Liste hinzufügen"

**💡 Hinweis:** Der Affiliate-Link wird automatisch hinzugefügt - der Organisator erhält eine kleine Provision!

### Wichtig: Geschenkliste muss VOLLSTÄNDIG sein!
- Min. 1 Geschenk
- Max. 10 Geschenke
- Alle Felder müssen ausgefüllt sein

---

## Phase 3: Auslosen (Organisator)

### Voraussetzungen
- ✅ ALLE Teilnehmer haben ihre Geschenkelisten eingetragen
- ✅ Der Organisator sieht auf dem Dashboard: **100% Fertig**

### Auslosen durchführen
1. Gehe zu deinem **Organisator-Dashboard** (Lesezeichen!)
2. Sehe den Fortschritt: "X von Y Teilnehmern fertig"
3. Wenn 100%: Button "🎲 Jetzt auslosen" wird aktiviert
4. Klick auf "🎲 Jetzt auslosen"
5. **Warnung:** Auslosen kann NICHT rückgängig gemacht werden!
6. Bestätige

---

## Phase 4: Wichtel-Partner Sehen (Alle Teilnehmer)

Nach dem Auslosen:

### Schritt 4.1: Partner anzeigen
Jeder Teilnehmer öffnet die Gruppe nochmal:
- `https://julklapp-online.vercel.app/[GRUPPE_ID]`
- ODER klickt im Teilnehmer-Link weiter

### Schritt 4.2: Wunschliste des Partners anschauen
- **🎁 Geschenke für [PARTNER_NAME]**
- Zeigt alle Geschenke, die dein Partner sich wünscht
- Jedes Geschenk hat einen **Amazon-Link**
  - Klick auf "Auf Amazon anschauen →"
  - Gehe shoppen!
  - **Affiliate-Provision** geht an den Organisator

### Was sieht man?
Für jeden Artikel:
- 📝 Name des Produkts
- 💰 Preis (falls eingetragen)
- 📷 Bild (if available)
- 🔗 Link zu Amazon
- ⭐ Bewertung (falls Amazon-API aktiv)

---

## Technische Details

### Geschenk-Eintrag Problem behoben ✅
**Fehler:** "Geschenk wird nicht gespeichert"
**Lösung:** Gift-API nun mit in-memory Fallback
- Funktioniert lokal OHNE Vercel KV
- Geschenke werden sofort gespeichert
- Beim Reload oder bei Vercel KV wird alles synchronisiert

### Wichtel-Partner Berechnung
- **Algorithmus:** Draw Algorithm (utils/drawAlgorithm.js)
- **Ausschlüsse:** Respektiert Exclusions der Teilnehmer
- **Fair:** Jeder bekommt genau EINEN Partner
- **Eindeutig:** Jeder schenkt an genau EINEN

### Daten-Speicherung
- **Frontend:** localStorage (Session-Daten)
- **Backend:** Vercel KV (Produktiv) + In-Memory Fallback (Entwicklung)
- **Sicherheit:** Keine Passworte nötig, nur anonyme IDs

---

## Häufig Gestellte Fragen (FAQ)

### F: Wie komme ich zu meinem Organisator-Dashboard zurück?
**A:**
- Speichere den Link als Lesezeichen (Strg+D)
- ODER sende ihn dir selbst per Email (Button im Dashboard)
- Format: `https://julklapp-online.vercel.app/organizer/[GRUPPE_ID]`

### F: Geschenk-Eintrag klappt nicht?
**A:**
- Browser aktualisieren (F5)
- Alle Felder ausfüllen (Name + Link beide erforderlich)
- Link muss von amazon.de sein
- Browser Console öffnen (F12) und Fehler prüfen

### F: Wie lange bin ich eine "Wunschliste"?
**A:** So lange die Gruppe aktiv ist. Nach Auslosen sehen dich nur noch deine Wichtel-Partner.

### F: Kann ich meine Geschenkeliste ändern?
**A:** Ja! Solange nicht ausgelost wurde, kannst du jederzeit:
- Geschenke hinzufügen (max. 10)
- Geschenke löschen (🗑️ Button)
- Bestehende Geschenke NICHT editieren (löschen + neu hinzufügen)

### F: Was passiert nach dem Auslosen?
**A:**
1. Jeder sieht seinen Partner
2. Jeder sieht die Wunschliste des Partners
3. Amazon-Links funktionieren sofort
4. Man kann einkaufen gehen!

### F: Kann man auslosen rückgängig machen?
**A:** NEIN! Auslosen ist unwiderruflich. Bitte sicherstellen, dass:
- Alle Geschenkelisten fertig sind
- Alle Exclusions gesetzt sind
- Der Organisator es wirklich will!

### F: Was ist der Affiliate-Link?
**A:**
- Der Organisator erhält eine kleine Provision (2-10%) wenn jemand über seinen Link auf Amazon kauft
- Für den Käufer ändert sich NICHTS (gleicher Preis!)
- Nur wenn der Kauf innerhalb von 24 Stunden nach Linkklick stattfindet

---

## Fehlerbehandlung

| Fehler | Ursache | Lösung |
|--------|--------|--------|
| "Gruppe nicht gefunden" | Falsche Group-ID | Link prüfen, Organisator fragen |
| "Geschenk wird nicht gespeichert" | API-Fehler | F5 Reload, Browser Cache leeren |
| "Du bist noch nicht angemeldet" | Session expired | Nochmal auf Join-Link klicken |
| "Partner nicht gefunden" | Nicht ausgelost | Warte bis Organisator auslost |
| "Keine Geschenke sichtbar" | Partner hat nicht eingetragen | Warte bis Partner die Liste macht |

---

## Kontakt & Support

Wenn etwas nicht funktioniert:
1. **Browser Console** öffnen (F12)
2. Fehler-Meldung copieren
3. Screenshot machen
4. Fehler melden

---

**Viel Spaß beim Wichteln! 🎁🎄**
