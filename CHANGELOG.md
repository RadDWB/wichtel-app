# Changelog

Alle wichtigen Änderungen an diesem Projekt sind in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2024-11-17

### ✨ Neu (Features)

- **Amazon Product Advertising API Integration**
  - Echte Amazon-Produkte mit Bildern, Preisen und Kundenbewertungen
  - Dynamische Produktsuche nach Kategorie, Geschlecht und Budget
  - Sichere Backend-Implementierung (Credentials bleiben privat)
  - Affiliate-Links automatisch generiert

- **Verbessertes Exclusions-System**
  - Benutzer können jetzt persönliche Ausschlüsse NACH Geschenkeliste definieren
  - Dynamische maximale Anzahl basierend auf Gruppengröße
  - Klare Phase-by-Phase Workflow (Geschenkeliste → Ausschlüsse → Warten)

- **Umfassende Dokumentation**
  - AMAZON_PA_SETUP.md - Vollständige Setup-Anleitung
  - AMAZON_PA_TROUBLESHOOTING.md - Troubleshooting-Guide
  - AMAZON_PA_DEBUG.md - Debug- und Test-Anleitung

### 🔧 Verbesserungen

- Bessere Fehlerbehandlung für API-Fehler (401, 403, 429, 500+)
- Detaillierte Fehlermeldungen mit Tipps für Benutzer
- Fallback auf manuelle Geschenk-Eingabe wenn API nicht verfügbar
- Verbesserte AWS Signature Version 4 Implementierung
- Umfangreiches Logging für Debugging

### 🐛 Behobene Bugs

- Fixed: Workflow skippte Exclusions-Phase
- Fixed: Ungültige Timestamps für AWS API-Signaturen
- Fixed: Error-Handling war nicht aussagekräftig genug

### 📚 Dokumentation

- Hinzufügt: AMAZON_PA_SETUP.md
- Hinzufügt: AMAZON_PA_TROUBLESHOOTING.md
- Hinzufügt: AMAZON_PA_DEBUG.md
- Updated: .env.example mit neuen Variablen

### 🔒 Sicherheit

- API-Credentials bleiben 100% auf Backend
- Secret Key wird NIE an Frontend exponiert
- Nur öffentliche Affiliate-Tag ist im Frontend

---

## [1.0.0] - 2024-11-10

### ✨ Neu (Features)

- **Hauptfeatures (MVP)**
  - Wichtel-Gruppen erstellen und verwalten
  - Teilnehmer einladen via Link
  - Geschenkelisten erstellen (bis 10 Items)
  - Namen auslosen mit Ausschluss-Logik
  - Partner-Geschenkeliste anschauen

- **Statische Geschenkideen-Browser**
  - 360 vordefinierte Geschenkelisten
  - 6 Kategorien (Tech, Lifestyle, Books, Home, Sports, Drinks)
  - Gender-aware Vorschläge (Für ihn/Für sie)
  - Budget-Filterung

- **UI/UX**
  - Responsive Design (Mobile + Desktop)
  - Schöne Gradient-Hintergründe
  - Intuitive 4-Phasen-Workflow
  - Deutsche Benutzeroberfläche

- **Datenspeicherung**
  - localStorage für lokale Entwicklung
  - Vercel KV Support für Production
  - Fallback-Mechanismen

### 🔧 Verbesserungen

- Budget-Parsing für verschiedene Formate (30€, 30 EUR, etc.)
- Dynamische Ausschluss-Logik basierend auf Gruppengröße
- Schnelle Auslosung mit gültiger Paarung

### 📦 Dependencies

- Next.js 14.2
- React 18.2
- TailwindCSS 3.4
- Vercel KV für Datenspeicherung

---

## Release Notes

### Version 1.1.0 Release Highlights

**🎯 Hauptziele erreicht:**
- ✅ Amazon PA API vollständig integriert
- ✅ Echte Produktdaten mit Bildern statt statische Daten
- ✅ Besserer Workflow für Exclusions
- ✅ Umfangreiche Dokumentation

**🚀 Für Production bereit:**
- ✅ Sichere Credential-Verwaltung
- ✅ Gutes Error-Handling
- ✅ Fallback-Lösungen
- ✅ Debugging-Tools

**📋 Bekannte Limitierungen:**
- PA API v5 braucht gültige Credentials
- Amazon API hat Rate-Limits
- Fallback: Manuelle Geschenk-Eingabe möglich

---

## Geplant für zukünftige Versionen

- [ ] Produkt-Caching für bessere Performance
- [ ] Suchhistorie speichern
- [ ] Erweiterte Filter (Marke, Farbe, Größe)
- [ ] Real-time Preis-Tracking
- [ ] Social Media Integration
- [ ] Mehr Sprachen Support
- [ ] Mobile App Version

---

**Version:** 1.1.0
**Letztes Update:** 17.11.2024
**Status:** Produktionsreif ✅
