# Amazon PA API - Debug & Test Guide

## 🔴 Fehler: "Authentication failed (403)"

**Was bedeutet das:**
- Deine Credentials sind ungültig ODER
- Dein Associates-Account hat keine PA API v5 Berechtigung ODER
- Die Keys sind falsch kopiert (mit Leerzeichen?)

## ✅ Schritt-für-Schritt Diagnose

### 1. Überprüfe .env.local

**Öffne:** `wichtel-app/.env.local`

```bash
AMAZON_PA_ACCESS_KEY=AKPAHLYMEP1763381371
AMAZON_PA_SECRET_KEY=p4Jp2dpQXeSYLXkyw+lxKrD3lxUCNsDesGUd7x1W
```

**Prüfe:**
- ❌ Sind die Keys **leer**?
- ❌ Haben sie **Leerzeichen** am Anfang/Ende?
- ❌ Sind sie **unvollständig** gekürzt?

Wenn ja → Korrigieren und Server neu starten!

### 2. Teste Credentials direkt

**In Node.js REPL (Kommandozeile):**

```bash
node

// Paste this:
const crypto = require('crypto');

const accessKey = 'AKPAHLYMEP1763381371';
const secretKey = 'p4Jp2dpQXeSYLXkyw+lxKrD3lxUCNsDesGUd7x1W';

console.log('Access Key länge:', accessKey.length);
console.log('Secret Key länge:', secretKey.length);
console.log('Hat Access Key Leerzeichen?', /\s/.test(accessKey));
console.log('Hat Secret Key Leerzeichen?', /\s/.test(secretKey));

// Exit
.exit
```

**Expected:**
- Access Key länge: 20
- Secret Key länge: 40
- Beide sollten FALSE sein (keine Leerzeichen)

### 3. Überprüfe Amazon Associates Einstellungen

1. Gehe zu [https://affiliate-program.amazon.de/](https://affiliate-program.amazon.de/)
2. Melde dich an
3. Gehe zu **Product Advertising API** Bereich
4. Prüfe: **Ist PA API v5 aktiviert?**

**Wenn NICHT aktiviert:**
- Klick auf "Request API Access" oder "Activate"
- Warte auf Bestätigung (5-15 Min)

**Wenn aktiviert:**
- Gehe zu "API Credentials"
- Prüfe die Credentials dort
- Vergleich mit deinen in `.env.local`

### 4. Teste mit echtem Amazon-Request

**Öffne Browser Console (F12):**

```javascript
// Teste die API direkt
fetch('/api/amazon/search?q=test&limit=1')
  .then(r => r.json())
  .then(d => {
    console.log('Status:', d.success ? '✅ OK' : '❌ ERROR');
    console.log('Error:', d.error);
    console.log('Details:', d.details);
  });
```

**Was du sehen solltest:**

✅ **Erfolgreich:**
```json
{ "success": true, "count": 1, "products": [...] }
```

❌ **Credentials Error:**
```json
{
  "error": "Amazon PA API credentials not configured",
  "hint": "Please add AMAZON_PA_ACCESS_KEY..."
}
```

❌ **Auth Error (403):**
```json
{
  "error": "Authentication failed (403): Check your access key and secret key",
  "details": "..."
}
```

### 5. Überprüfe Server Logs

**In dem Terminal, wo `npm run dev` läuft:**

```
🔍 Searching Amazon PA for: { query: 'test', maxPrice: null, limit: 1 }
📡 Amazon PA Response Status: 403
❌ API Error: { status: 403, body: '{"__type":"InvalidSignatureException"...}' }
```

**Was bedeutet das:**
- `InvalidSignatureException` → Signature ist falsch (Secret Key Problem)
- `AccessDeniedException` → Account hat keine Berechtigung
- `UnrecognizedClientException` → Access Key ungültig

---

## 🔧 Schnelle Fixes

### Problem: Keys sind falsch kopiert

**Lösung:**
1. Amazon Associates Dashboard öffnen
2. Product Advertising API → Credentials
3. **Nicht** mit Text-Editor kopieren!
4. Nutze: **Strg+A, Strg+C direkt von Amazon**
5. Paste in `.env.local`
6. Server neu starten

### Problem: PA API nicht aktiviert

**Lösung:**
1. Amazon Associates anmelden
2. Product Advertising API Sektion
3. Klick: "Activate API" oder "Request Access"
4. Warte auf Email-Bestätigung
5. Generiere neue Credentials
6. Eintragen in `.env.local`

### Problem: Keys abgelaufen

**Lösung:**
1. Gehe zu Amazon Product Advertising API
2. Alte Credentials löschen
3. Neue Credentials generieren
4. Eintragen in `.env.local`
5. Server neu starten

---

## 📊 Credential Checklist

Bevor du mich fragst, überprüfe:

- [ ] `.env.local` existiert
- [ ] `AMAZON_PA_ACCESS_KEY` ist nicht leer
- [ ] `AMAZON_PA_SECRET_KEY` ist nicht leer
- [ ] Keine Leerzeichen bei den Keys
- [ ] Keys sind vollständig kopiert
- [ ] PA API ist in Amazon Associates **aktiviert**
- [ ] Server wurde **nach Edit neu gestartet** (`npm run dev`)

---

## 🚨 Wenn NICHTS hilft

1. **Neue Keys generieren:**
   - Amazon Associates anmelden
   - Alte Keys löschen
   - Neue Keys generieren
   - Direkt kopieren (kein Editor zwischendurch!)

2. **Credentials in .env.local speichern:**
   ```
   AMAZON_PA_ACCESS_KEY=<dein-neuer-access-key>
   AMAZON_PA_SECRET_KEY=<dein-neuer-secret-key>
   ```

3. **Server neu starten:**
   ```bash
   npm run dev
   ```

4. **Test in Browser:**
   - F12 → Console
   - Kategorie + Geschlecht wählen
   - Fehler aufschreiben

5. **Falls immer noch 403:**
   - Gib mir diese Infos:
     - Access Key (erste 8 Zeichen): `AKPAHLY**`
     - Secret Key länge: `40 Zeichen?`
     - Browser Console Error (vollständig)
     - Server Log Error (vollständig)

---

## 🔗 Hilfreiche Links

- [Amazon Associates Dashboard](https://affiliate-program.amazon.de/)
- [Product Advertising API Docs](https://docs.aws.amazon.com/search-quality.html)
- [PA API v5 Reference](https://webservices.amazon.de/paapi5/documentation/)

---

**Mach diese Checks und sag mir, was du findest!** 🎯
