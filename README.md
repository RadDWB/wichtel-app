# 🎁 Julklapp Online - Wichteln und Beschenken leicht gemacht

Kostenlose Web-App zum **Online-Wichteln** mit Geschenkelisten, Amazon-Links und fairem Auslosungs-Algorithmus.

**Für Gruppen, Familien, Vereine, Freunde... zu allen Gelegenheiten, nicht nur Weihnachten!**

## ✨ Features

- ✅ **Gruppen erstellen** - Mit Namen, Budget und beliebig vielen Teilnehmern
- ✅ **Freunde einladen** - Per Link ohne Registrierung
- ✅ **Faire Auslosung** - Intelligenter Algorithmus mit Ausschluss-Optionen (z.B. Partner)
- ✅ **Geschenkelisten** - Bis zu 10 Geschenke pro Person mit Kategorien
- ✅ **Amazon Integration** - Links werden automatisch mit Affiliate-Tag versehen
- ✅ **Filterung** - Nach Kategorie & Preis suchen
- ✅ **100% kostenlos** - Keine Registrierung, keine Datensammlung
- ✅ **Vercel KV Backend** - Sichere Datenspeicherung auf Vercel-Servern

## 🚀 Installation & Lokale Entwicklung

### Voraussetzungen
- Node.js 18+
- npm oder yarn

### Setup

```bash
# Dependencies installieren
npm install

# Lokale Entwicklung starten
npm run dev
```

Die App läuft unter `http://localhost:3000`

### Umgebungsvariablen

Kopiere `.env.example` zu `.env.local` und fülle die Werte ein:

```bash
cp .env.example .env.local
```

Dann editiere `.env.local`:

```env
NEXT_PUBLIC_AMAZON_AFFILIATE_TAG=dein-affiliate-tag
```

## 📦 Deployment auf Vercel

### Schritt 1: Projekt zu GitHub pushen

```bash
git add .
git commit -m "Initial commit: wichtel-app with Tailwind UI"
git push origin main
```

### Schritt 2: Auf Vercel deployen

1. Gehe zu [Vercel](https://vercel.com)
2. Klicke "New Project"
3. Verbinde dein GitHub-Repo
4. Vercel wird automatisch `Next.js` erkennen
5. Im "Environment Variables" Section:
   - Füge `NEXT_PUBLIC_AMAZON_AFFILIATE_TAG` hinzu mit deinem Affiliate-Tag

### Schritt 3: Vercel KV aktivieren (für persistente Daten)

1. Gehe zu deinem Vercel Project Dashboard
2. Klicke "Storage" → "Create Database"
3. Wähle "KV"
4. Folge den Anweisungen
5. Die `KV_*` Variablen werden automatisch zu deinem Projekt hinzugefügt

**Nach dem Setup:** Die App speichert alle Daten auf Vercel KV statt localStorage!

## 🛠️ Tech Stack

- **Frontend**: React 18 + Next.js 14
- **Styling**: Tailwind CSS 3
- **Database**: Vercel KV (Redis)
- **Deployment**: Vercel
- **UUID**: `uuid` für eindeutige IDs

## 📁 Projekt Struktur

```
wichtel-app/
├── components/          # React-Komponenten
│   ├── CreateGroup.js
│   ├── DrawNames.js
│   ├── Wishlist.js
│   └── AddParticipants.js
├── pages/
│   ├── api/            # API Routes
│   │   ├── groups/
│   │   ├── wishlist/
│   │   └── draw/
│   ├── index.js        # Homepage
│   ├── [groupId].js    # Group Dashboard
│   └── _app.js         # Next.js App
├── styles/
│   └── globals.css     # Tailwind + Custom CSS
├── utils/
│   └── drawAlgorithm.js # Wichtel-Auslosungs-Logik
├── lib/
│   └── kv.js          # Vercel KV Helper
└── tailwind.config.js  # Tailwind-Konfiguration
```

## 🔄 Workflow

1. **Gruppe erstellen**
   - Budget eingeben
   - Gruppe wird mit eindeutiger ID erstellt

2. **Teilnehmer einladen**
   - Link mit Freunden teilen
   - Freunde treten mit ihrem Namen bei

3. **Namen auslosen**
   - "Los geht's" Button klicken
   - Jeder sieht nur seinen Wichtelpartner

4. **Wunschlisten**
   - Jeder erstellt eine Liste für seinen Partner
   - Amazon-Links werden mit Affiliate-Tag versehen
   - Links sind privat und nur für den Wichtel sichtbar

## 🤝 Amazon Affiliate-Links

Die App fügt automatisch deinen Amazon Affiliate-Tag zu Links hinzu:

```
Eingabe:  https://amazon.de/dp/B08N5WRWNW
Output:   https://amazon.de/dp/B08N5WRWNW?tag=wichtel-app-21
```

**Wichtig**: Ersetze `wichtel-app-21` in `.env.local` mit deinem echten Affiliate-Tag!

Du kannst deinen Tag hier bekommen: [Amazon Affiliate Program](https://affiliate-program.amazon.de)

## 🧪 Testing

Derzeit keine automatisierten Tests. Für manuelles Testen:

```bash
npm run dev
```

Dann:
1. Gruppe anlegen
2. Den Link in mehreren Tabs öffnen (als verschiedene Benutzer)
3. Alle als Teilnehmer anmelden
4. Auslosen
5. Wunschlisten erstellen

## 📄 Lizenz

MIT - Frei verwendbar

## 🐛 Bugs & Feature Requests

Erstelle einen Issue auf GitHub oder kontaktiere den Entwickler.

---

**Viel Spaß beim Wichteln!** 🎁
