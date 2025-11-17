import { useState } from 'react';
import CreateGroup from '../components/CreateGroup';

export default function Home() {
  const [groupId, setGroupId] = useState(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      <main className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎄 Wichteln Online
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Organisiere dein Wichteln in 3 Schritten – kostenlos & anonym!
          </p>
          <p className="text-gray-500">Mit Wunschlisten und Amazon Affiliate-Links</p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
          <div className="card">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-bold mb-2">Gruppe erstellen</h3>
            <p className="text-sm text-gray-600">Einfach eine neue Wichtelrunde anlegen und Freunde einladen</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">🎲</div>
            <h3 className="font-bold mb-2">Fair auslosen</h3>
            <p className="text-sm text-gray-600">Geheimer Algorithmus für faire Zufallspaarungen</p>
          </div>
          <div className="card">
            <div className="text-3xl mb-2">🛍️</div>
            <h3 className="font-bold mb-2">Wunschlisten</h3>
            <p className="text-sm text-gray-600">Wünsche mit Amazon-Links für den Wichtelpartner teilen</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto">
          {!groupId ? (
            <div>
              <div className="card bg-white shadow-lg mb-6">
                <h2 className="section-title">Starten wir!</h2>
                <CreateGroup onGroupCreated={setGroupId} />
              </div>

              {/* Instructions */}
              <div className="card bg-blue-50 border-l-4 border-blue-500">
                <h3 className="font-bold mb-3">Wie funktioniert's?</h3>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li><strong>1.</strong> Gruppe mit Budget anlegen</li>
                  <li><strong>2.</strong> Link mit Freunden teilen, die sich anmelden</li>
                  <li><strong>3.</strong> Namen auslosen & Wunschlisten erstellen</li>
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
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Keine Registrierung • Keine Datensammlung • 100% kostenlos</p>
        </div>
      </main>
    </div>
  );
}