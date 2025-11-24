import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup } from '../../lib/kv-client';
import { APP_VERSION } from '../../lib/constants';

export const getServerSideProps = async () => {
  return { props: {} };
};

export default function PublicPairings() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [pairings, setPairings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      let groupData = null;

      // Try KV first
      try {
        groupData = await getGroup(groupId);
      } catch (kvErr) {
        console.log('KV not available, trying API');
      }

      // Fallback to API
      if (!groupData) {
        try {
          const response = await fetch(`/api/groups/list?groupId=${groupId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.groups && data.groups.length > 0) {
              groupData = data.groups[0];
            }
          }
        } catch (apiErr) {
          console.error('API not available:', apiErr);
        }
      }

      if (groupData) {
        setGroup(groupData);

        // Check if pairings are public and draw has happened
        if (!groupData.drawn) {
          setError('❌ Die Auslosung hat noch nicht stattgefunden. Diese Seite wird später verfügbar.');
        } else if (groupData.settings?.pairingVisibility !== 'public') {
          setError('❌ Diese Wichtelgruppe hat private Paarungen. Sie sind nicht öffentlich einsehbar.');
        } else {
          // Load pairings - construct from pairings map in group
          try {
            const pairingList = [];
            if (groupData.pairings) {
              Object.entries(groupData.pairings).forEach(([fromId, toId]) => {
                const fromParticipant = groupData.participants.find(p => p.id === fromId);
                const toParticipant = groupData.participants.find(p => p.id === toId);
                if (fromParticipant && toParticipant) {
                  pairingList.push({
                    fromName: fromParticipant.name,
                    toName: toParticipant.name,
                  });
                }
              });
            }
            setPairings(pairingList);
          } catch (err) {
            console.error('Error loading pairings:', err);
            setError('Fehler beim Laden der Paarungen');
          }
        }
      } else {
        setError('❌ Gruppe nicht gefunden');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Fehler beim Laden der Seite');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">🔄 Lädt...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto mb-8">
          <Link href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück
          </Link>

          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">🎁 Alle Paarungen</h1>
            <p className="text-lg">{group?.name}</p>
            <p className="text-sm mt-2 opacity-90">Wichteladministrator: {group?.organizerName}</p>
          </div>

          {error && (
            <div className="bg-orange-100 border-l-4 border-orange-400 p-4 rounded mb-8">
              <p className="text-orange-800">{error}</p>
            </div>
          )}

          {!error && pairings.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-bold mb-6">Wer beschenkt wen? 🎉</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pairings.map((pairing, index) => (
                  <div
                    key={index}
                    className="p-6 border-2 border-blue-300 bg-blue-50 rounded-lg hover:shadow-lg transition"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Beschenkt von:</p>
                        <p className="text-xl font-bold text-gray-900">{pairing.fromName}</p>
                      </div>
                      <span className="text-3xl">🎁</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Für:</p>
                        <p className="text-xl font-bold text-purple-600">{pairing.toName}</p>
                      </div>
                      <span className="text-3xl">🎉</span>
                    </div>

                    {group?.budget && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-xs text-gray-600">Budget:</p>
                        <p className="text-sm font-semibold text-gray-800">{group.budget}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!error && pairings.length === 0 && (
            <div className="bg-blue-100 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-blue-800">Keine Paarungen verfügbar</p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto mt-12 text-center text-sm text-gray-600">
          <p>Wichtel v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
