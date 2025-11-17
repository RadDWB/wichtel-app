# Amazon PA API Troubleshooting Guide

## Problem: "Fehler beim Laden der Produkte"

Wenn die App meldet, dass Produkte nicht geladen werden können, folge diese Schritt-für-Schritt Anleitung:

### Schritt 1: Browser-Konsole öffnen (F12)

1. Öffne die Wichtel-App im Browser
2. Drücke **F12** oder Strg+Shift+I
3. Gehe zum **Console** Tab (Reiter oben)
4. Versuche, Produkte zu laden (Kategorie + Geschlecht auswählen)
5. **Schreib alle Error-Meldungen ab** - diese helfen beim Debuggen

### Schritt 2: Server-Logs überprüfen

**Wenn du lokal entwickelst (npm run dev):**

1. Schau in das Terminal/Kommandozeilen-Fenster, wo `npm run dev` läuft
2. Dort siehst du Logs mit:
   - 🔍 `Searching Amazon PA for: ...`
   - 📡 `Amazon PA Response Status: ...` (z.B. 200, 401, 403)
   - ❌ `API Error:` oder andere Fehler

**Fehler-Codes erklären:**

- **Status 200**: OK - aber vielleicht keine Produkte gefunden
- **Status 401**: Authentifizierung fehlgeschlagen (falscher Access Key)
- **Status 403**: Keine Berechtigung (falscher Secret Key oder Associates-Account)
- **Status 429**: Rate Limit überschritten (zu viele Requests)
- **Status 500+**: Amazon Server-Fehler

### Schritt 3: Credentials überprüfen

**Überprüfe, dass `.env.local` korrekt gesetzt ist:**

```bash
# Im Terminal/Kommandozeile:
cat .env.local
```

Du solltest sehen:
```
AMAZON_PA_ACCESS_KEY=AKPAHLYMEP1763381371
AMAZON_PA_SECRET_KEY=p4Jp2dpQXeSYLXkyw+lxKrD3lxUCNsDesGUd7x1W
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=httpwwwspor03-21
```

Wenn die Keys **leer** sind oder fehlen → Server neu starten (`npm run dev`)

### Schritt 4: API-Response überprüfen

**Im Browser Console, gib das ein:**

```javascript
// Öffne die Network-Tools (F12 → Network Tab)
// Wähle Kategorie + Geschlecht
// Suche nach der Anfrage "search?q=..."
// Klicke drauf und schau die "Response"

// Oder direkt API testen:
fetch('/api/amazon/search?q=Technik&limit=5')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Mögliche Responses:**

✅ **Erfolgreich:**
```json
{
  "success": true,
  "count": 5,
  "products": [
    {
      "name": "Product Name",
      "price": 29,
      "imageUrl": "https://...",
      ...
    }
  ]
}
```

❌ **Fehler - Credentials missing:**
```json
{
  "error": "Amazon PA API credentials not configured",
  "hint": "Please add AMAZON_PA_ACCESS_KEY and AMAZON_PA_SECRET_KEY..."
}
```

❌ **Fehler - Invalid credentials:**
```json
{
  "error": "Authentication failed (401): Check your access key and secret key"
}
```

❌ **Fehler - Amazon Server Error:**
```json
{
  "error": "Amazon API error (500): Server error, try again later"
}
```

### Schritt 5: Verschiedene Fehler beheben

#### "Amazon PA API nicht konfiguriert"

**Ursache:** Keys sind leer oder nicht gesetzt

**Lösung:**
1. `.env.local` öffnen
2. Keys eintragen
3. Server neu starten: `npm run dev`

#### "Amazon API Authentifizierung fehlgeschlagen" (401)

**Ursache:** Access Key ist falsch oder abgelaufen

**Lösung:**
1. Gehe zu [Amazon Associates Dashboard](https://affiliate-program.amazon.de/)
2. Product Advertising API Bereich
3. Generiere einen **neuen Access Key**
4. Kopiere den Key in `.env.local`
5. Server neu starten

#### "Amazon API Authentifizierung fehlgeschlagen" (403)

**Ursache:** Secret Key ist falsch oder Associates-Account hat keine PA API Berechtigung

**Lösung:**
1. Gehe zu Amazon Associates
2. Überprüfe, dass Product Advertising API **aktiviert** ist
3. Generiere neue Credentials
4. Stelle sicher, dass beide Keys korrekt kopiert sind (keine Leerzeichen!)

#### "Amazon API ist momentan überlastet" (429)

**Ursache:** Zu viele Requests in kurzer Zeit

**Lösung:**
- Warten Sie 1-2 Minuten
- Versuchen Sie es erneut

#### "Keine Produkte im Budget gefunden"

**Ursache:** Für deine Suchkriterien (Kategorie+Geschlecht+Budget) gibt es keine Produkte

**Mögliche Lösungen:**
- Budget erhöhen
- Andere Kategorie wählen
- Anderes Geschlecht ausprobieren

### Schritt 6: Manuelles API-Testen

**Mit curl (Kommandozeile):**

```bash
curl "http://localhost:3000/api/amazon/search?q=Bluetooth%20Kopfhörer&maxPrice=50&limit=5"
```

**Mit Browser Dev Tools (Network Tab):**

1. F12 öffnen → Network Tab
2. Kategorie + Geschlecht wählen
3. Suche nach Request "search?q=..."
4. Klick drauf
5. Schau unter "Response" und "Headers"

### Schritt 7: Vollständiges Debugging

**Wenn oben nichts hilft, überprüfe das:**

1. **Node.js Version:**
   ```bash
   node --version
   # Sollte v16+ sein
   ```

2. **Env-Variablen werden geladen:**
   ```bash
   # In Node.js REPL:
   node
   > process.env.AMAZON_PA_ACCESS_KEY
   # Sollte deinen Key anzeigen
   ```

3. **Netzwerk-Probleme:**
   - Funktioniert eine andere API? (z.B. kannst du google.de öffnen?)
   - Ist deine Firewall/VPN ein Problem?

4. **Logs detailliert prüfen:**
   - Suche nach 🔍, 📡, ❌ in den Server-Logs
   - Kopiere die komplette Error-Nachricht

### Schritt 8: Stack Trace sammeln

**Wenn du mir Hilfe suchst, sammeln:**

```
1. Browser Console Error (F12 → Console)
2. Server Log Error (npm run dev Fenster)
3. Network Response (F12 → Network → search request)
4. Deine .env.local (OHNE echte Keys teilen!)
```

---

## Häufige Fehler Schnell-Lösungs-Guide

| Problem | Ursache | Lösung |
|---------|--------|--------|
| "nicht konfiguriert" | Keys fehlen | Keys in `.env.local` eintragen |
| "Authentifizierung fehlgeschlagen (401)" | Access Key falsch | Neuen Key von Amazon holen |
| "Authentifizierung fehlgeschlagen (403)" | Secret Key falsch oder PA API nicht aktiviert | Secret Key überprüfen oder PA API aktivieren |
| "Rate limited (429)" | Zu viele Requests | 1-2 Min warten, dann erneut versuchen |
| "Amazon API error (500+)" | Amazon Server Problem | Warten und später erneut versuchen |
| "Keine Produkte im Budget" | Keine Produkte für diese Kriterien | Budget erhöhen oder Kategorie ändern |

---

## Für Entwickler: API-Response Format

**Erfolgreiche SearchItems Response:**

```json
{
  "SearchResult": {
    "Items": [
      {
        "ASIN": "B08N5WRWNW",
        "ItemInfo": {
          "Title": {
            "DisplayValue": "Product Name"
          }
        },
        "Offers": {
          "Listings": [
            {
              "Price": {
                "Amount": 29.99
              }
            }
          ]
        },
        "Images": {
          "Primary": {
            "Large": {
              "URL": "https://..."
            }
          }
        },
        "CustomerReviews": {
          "StarRating": {
            "DisplayValue": "4.5"
          },
          "Count": {
            "DisplayValue": "123"
          }
        }
      }
    ]
  }
}
```

---

## Noch nicht gelöst?

Folgende Infos sammeln und mir mitteilen:

1. **Vollständiger Browser Console Error**
2. **Vollständiger Server Log** (von 🔍 bis ❌)
3. **API Response** (Network Tab → search request → Response)
4. **Was wurde versucht** (welche Kategorie, welches Budget, etc.)

Mit diesen Infos kann ich das Problem schneller lösen! 🎯
