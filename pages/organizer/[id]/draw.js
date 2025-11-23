import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, saveGroup } from '../../../lib/kv-client';
import { getPostDrawShareText } from '../../../lib/constants';

// Force SSR to prevent static generation errors
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

// Amazon Affiliate Links with different budget ranges
const AMAZON_AFFILIATE_LINKS = {
  // Für verschiedene Preisranges - diese Links leiten zu gefilterten Suchergebnissen
  all: 'https://www.amazon.de/s?k=geschenkideen&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl',
  lowBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A500-1500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl', // 5-15€
  mediumBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A2000-3000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl', // 20-30€
  highBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A5000-10000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl', // 50-100€
};

export default function DrawPage() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = async () => {
    try {
      // Try KV first (primary)
      let groupData = null;
      try {
        groupData = await getGroup(id);
        if (groupData) {
          console.log('✅ Group loaded from KV');
        }
      } catch (kvErr) {
        console.log('KV not available, trying API:', kvErr);
      }

      // Fallback to API
      if (!groupData) {
        try {
          const response = await fetch(`/api/groups/list?groupId=${id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.groups && data.groups.length > 0) {
              groupData = data.groups[0];
              console.log('✅ Group loaded from API');
            }
          }
        } catch (apiErr) {
          console.error('API not available:', apiErr);
        }
      }

      if (groupData) {
        setGroup(groupData);
      } else {
        setError('Fehler beim Laden der Gruppe');
      }
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Fehler beim Laden der Gruppe');
    } finally {
      setLoading(false);
    }
  };

  // Get appropriate Amazon link based on budget
  const getAmazonLink = () => {
    if (!group?.budget) return AMAZON_AFFILIATE_LINKS.all;

    const budget = group.budget.toLowerCase();
    if (budget.includes('5') || budget.includes('10') || budget.includes('15')) {
      return AMAZON_AFFILIATE_LINKS.lowBudget;
    } else if (budget.includes('20') || budget.includes('25') || budget.includes('30')) {
      return AMAZON_AFFILIATE_LINKS.mediumBudget;
    } else if (budget.includes('50') || budget.includes('100')) {
      return AMAZON_AFFILIATE_LINKS.highBudget;
    }
    return AMAZON_AFFILIATE_LINKS.all;
  };

  const getParticipantLink = () => `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${id}`;

  const performDraw = async () => {
    if (!window.confirm('⚠️ WARNUNG: Das Auslosen kann NICHT rückgängig gemacht werden! Sicher fortfahren?')) {
      return;
    }

    setDrawing(true);
    setError('');

    try {
      const response = await fetch(`/api/draw/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auslosung fehlgeschlagen');
      }

      const data = await response.json();

      // Update local state (no need to save to localStorage - KV was updated by API)
      const updatedGroup = {
        ...group,
        drawn: true,
        pairing: data.pairing,
        drawnAt: new Date().toISOString(),
      };

      setGroup(updatedGroup);
      setSuccess(true);
    } catch (err) {
      console.error('Error performing draw:', err);
      setError(err.message || 'Fehler beim Auslosen');
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">🔄 Lädt...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-900 mb-4">❌ Gruppe nicht gefunden</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    const participantLink = getParticipantLink();
    const postDrawShareText = getPostDrawShareText(participantLink);

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="bg-white rounded-lg p-12 shadow-lg">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-4xl font-bold text-green-600 mb-4">Auslosung erfolgreich!</h1>
            <p className="text-xl text-gray-700 mb-2">
              Die Wichtel-Paarungen wurden generiert. Jeder Teilnehmer kann jetzt seinen Partner und dessen Wunschliste sehen, wenn er seinen PIN eingibt.
            </p>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-8 text-left">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Was passiert jetzt:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ Alle Teilnehmer können die Gruppe öffnen und sehen, wen sie beschenken</li>
                <li>✅ Jeder sieht die Wunschliste des Partners mit Amazon-Links</li>
                <li>✅ Jeder kann direkt auf Amazon einkaufen</li>
                <li>✅ Wir nehmen am Amazon Affiliate Programm teil – Sie unterstützen uns durch Ihre Käufe!</li>
              </ul>
            </div>

            {/* Participant Share Link Section - ORANGE BOX */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-lg p-6 mb-8 text-left shadow-md">
              <h2 className="text-xl font-bold text-orange-900 mb-3">📢 Link für Teilnehmer kopieren & versenden:</h2>
              <p className="text-sm text-gray-700 mb-4">
                Kopiere diesen Link und versende ihn an alle Teilnehmer. Sie können damit ihre Wichtel-Partner sehen:
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={participantLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border-2 border-orange-300 rounded-lg font-mono text-sm text-gray-800"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(participantLink);
                    alert('✅ Link kopiert!');
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition whitespace-nowrap"
                >
                  📋 Kopieren
                </button>
              </div>
              <div className="bg-white p-4 rounded border-l-4 border-orange-400">
                <p className="text-xs text-gray-700 font-semibold mb-2">Nachricht zum Versenden:</p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {postDrawShareText}
                </p>
              </div>
            </div>

            {/* Prominent Amazon Affiliate Section */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-lg p-6 mb-8 shadow-md">
              <h2 className="text-2xl font-bold text-orange-900 mb-3">🛍️ Jetzt einkaufen gehen!</h2>
              <p className="text-gray-700 mb-5">
                Stöbere jetzt auf Amazon.de nach tollen Geschenkideen für deine Wichtel! Wir nehmen am Amazon Affiliate Programm teil – Sie unterstützen uns durch Ihre Käufe.
              </p>
              <a
                href={getAmazonLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full md:w-auto text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 shadow-lg text-lg"
              >
                🎁 Zu Amazon.de
              </a>
              <p className="text-xs text-gray-600 mt-3">
                Mit deinem Budget: <strong>{group?.budget || 'Flexibel'}</strong>
              </p>
            </div>

            <p className="text-gray-600 mb-8">
              Leite deine Teilnehmer auf die Seite weiter, damit sie ihre Wichtel-Partner sehen können.
            </p>

            <Link href={`/organizer/${id}`} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
              ← Zum Dashboard zurück
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-6 text-center">🎲 Auslosung starten</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              ❌ Fehler: {error}
            </div>
          )}

          {/* Prerequisites Check */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">✅ Checkliste vor Auslosung:</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Alle Teilnehmer haben sich angemeldet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Alle Teilnehmer haben ihre Geschenkelisten eingegeben</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Alle Exclusions wurden gesetzt</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Auslosung kann NICHT rückgängig gemacht werden!</span>
              </li>
            </ul>
          </div>

          {/* Group Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded p-4">
              <p className="text-gray-600 text-sm font-semibold">Gruppe</p>
              <p className="text-2xl font-bold text-gray-900">{group.name}</p>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-gray-600 text-sm font-semibold">Teilnehmer</p>
              <p className="text-2xl font-bold text-gray-900">{group.participants?.length || 0}</p>
            </div>
          </div>

          {/* Participants List */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">📋 Teilnehmer die ausgelost werden:</h3>
            <div className="space-y-2">
              {group.participants && group.participants.length > 0 ? (
                group.participants.map((p) => (
                  <div key={p.id} className="bg-gray-50 p-3 rounded flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Keine Teilnehmer</p>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-8">
            <p className="text-red-900 font-bold mb-2">⚠️ WICHTIG:</p>
            <p className="text-sm text-red-800">
              Bitte stelle sicher, dass ALLE Teilnehmer ihre Geschenkelisten eingetragen haben, bevor du auslos! Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link href={`/organizer/${id}`} className="flex-1 btn-outline text-center">
              ← Zurück
            </Link>
            <button
              onClick={performDraw}
              disabled={drawing}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {drawing ? '🔄 Wird ausgelost...' : '🎲 Jetzt auslosen!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
