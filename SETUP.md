# Wichtel App - Setup-Anleitung

## Voraussetzungen

- Node.js >= 16 installed
- npm oder yarn
- Redis-Zugang (bereits konfiguriert)

## Installation

### 1. Dependencies installieren

```bash
npm install
```

Das installiert:
- Next.js 14.2.15
- React 18.2.0
- Redis Client 4.6.11
- Tailwind CSS für Styling

### 2. Environment-Variablen konfigurieren

Datei `.env.local` ist bereits vorhanden mit deinen Redis-Credentials:

```env
REDIS_URL=redis://default:9fQYapvZzpjDDXDgPiY1kKjhPOHMIrrI@redis-10625.c300.eu-central-1-1.ec2.cloud.redislabs.com:10625
NODE_ENV=development
```

### 3. Development-Server starten

```bash
npm run dev
```

Die App ist dann verfügbar unter: **http://localhost:3000**

## Architektur-Änderungen (v2.0.0)

### Datenspeicherung
- **Redis** (Hauptspeicher): Groups, Gifts, Exclusions, Pairings
- **localStorage** (Nur Session-Daten): `participant_{groupId}`, `organizer_{groupId}`

### Datenbankfunktionen (`lib/kv.js`)
- `getGroup(id)` - Gruppe laden
- `saveGroup(id, group)` - Gruppe speichern
- `getAllGroups()` - Alle Gruppen abrufen
- `getGifts(groupId, participantId)` - Geschenkeliste laden
- `saveGifts(groupId, participantId, gifts)` - Geschenkeliste speichern
- `getExclusions(groupId, participantId)` - Ausschlüsse laden
- `saveExclusions(groupId, participantId, exclusions)` - Ausschlüsse speichern
- `getPairing(groupId)` - Paarungen laden
- `savePairing(groupId, pairing)` - Paarungen speichern

### API-Endpoints
- `GET /api/groups/list?groupId={id}` - Gruppe laden
- `POST /api/groups/list` - Gruppe speichern
- `POST /api/draw/{groupId}` - Auslosung durchführen
- `GET/POST /api/gifts/{groupId}` - Geschenkelisten verwalten

## Fehlerbehandlung

Wenn Redis nicht erreichbar ist:
- Entwicklung: Falls Redis lokal nicht läuft, wird eine aussagekräftige Fehlermeldung angezeigt
- Production (Vercel): Die `.env.local` REDIS_URL muss in den Vercel Environment Variables konfiguriert werden

## Testing

### Lokale Tests
1. App starten: `npm run dev`
2. Zur Startseite gehen: http://localhost:3000
3. Neue Wichtelgruppe erstellen (Setup 5 Schritte)
4. Gruppe sollte in Redis gespeichert werden
5. Organizer-Dashboard sollte die Gruppe anzeigen

### Cross-Browser Testing
1. In verschiedenen Browsern die gleiche Gruppe aufrufen
2. Daten sollten über Redis synchronisiert sein (nicht localStorage)

## Build & Deployment

```bash
# Build für Production
npm run build

# Production starten
npm start
```

**Wichtig für Vercel**: Stelle sicher, dass `REDIS_URL` als Environment Variable gesetzt ist!
