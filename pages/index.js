import { useState } from 'react';
import CreateGroup from '../components/CreateGroup';

export default function Home() {
  const [groupId, setGroupId] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <main className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600">
              🎁 Julklapp Online
            </h1>
            <span className="inline-block bg-gradient-to-r from-red-600 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              v1.0
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mb-4">
            Wichteln und Beschenken leicht gemacht...
          </p>
          <p className="text-lg text-gray-600 mb-1">
            zu allen Gelegenheiten, nicht nur Weihnachten
          </p>
          <p className="text-lg text-gray-600">
            für Gruppen, Familien, Vereine, Freunde...
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 hover:shadow-lg transition">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="font-bold mb-2 text-orange-700">Gruppe erstellen</h3>
            <p className="text-sm text-gray-700">Einfach eine neue Runde anlegen und Freunde, Familie oder Verein einladen</p>
          </div>
          <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🎲</div>
            <h3 className="font-bold mb-2 text-red-700">Fair auslosen</h3>
            <p className="text-sm text-gray-700">Intelligenter Algorithmus für faire & gerechte Zufallspaarungen</p>
          </div>
          <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 hover:shadow-lg transition">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="font-bold mb-2 text-amber-700">Geschenkeliste</h3>
            <p className="text-sm text-gray-700">Bis zu 10 Geschenke mit Kategorien & Amazon-Links teilen</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <div className="card bg-gradient-to-br from-white to-amber-50 shadow-xl border-2 border-amber-200 mb-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-amber-600">
              🚀 Jetzt starten!
            </h2>
            <a
              href="/setup"
              className="block w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold py-3 rounded-lg text-center hover:from-red-700 hover:to-orange-600 transition"
            >
              ✅ Neue Wichtelgruppe anlegen
            </a>
          </div>

              {/* Instructions */}
              <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-orange-500">
                <h3 className="font-bold mb-3 text-orange-700">✨ In 3 Schritten zur Bescherung:</h3>
                <ol className="space-y-3 text-sm text-gray-800">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                    <span><strong>Gruppe erstellen</strong> – Mit Budget und Namen</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                    <span><strong>Freunde einladen</strong> – Link teilen, alle melden sich an</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">3</span>
                    <span><strong>Auslosen & beschenken</strong> – Geschenkelisten anlegen, einkaufen, schenken!</span>
                  </li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="success text-center">
              <h3>✅ Gruppe erstellt!</h3>
              <p className="text-gray-700 mb-4">Teile diesen Link mit allen Teilnehmern:</p>
              <code className="code block mb-4">
                {typeof window !== 'undefined' ? `${window.location.origin}/${groupId}` : ''}
              </code>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/${groupId}`);
                    alert('Link kopiert!');
                  }
                }}
                className="btn-outline mr-2"
              >
                📋 Kopieren
              </button>
              <a href={`/${groupId}`} className="btn-secondary">
                Zur Gruppe →
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold text-gray-700">
              ✅ Keine Registrierung • 🔒 Keine Datensammlung • 💚 100% kostenlos
            </p>
            <p className="text-xs text-gray-500">
              Perfekt für Weihnachten, Geburtstage, Hochzeiten, Betriebsfeiern & mehr
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Made with ❤️ for families, friends & communities
          </p>
        </div>
      </main>
    </div>
  );
}