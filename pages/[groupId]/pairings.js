import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../lib/kv-client';
import GiftList from '../../components/GiftList';
import { APP_VERSION } from '../../lib/constants';

// Test deployment verification branch - should show version v2.0.0
export const getServerSideProps = async () => {
  return { props: {} };
};

export default function PairingsPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [gifts, setGifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedPerson, setExpandedPerson] = useState(null);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      let groupData = null;

      // Try KV first (primary)
      try {
        groupData = await getGroup(groupId);
        if (groupData) {
          console.log('✅ Group loaded from KV');
        }
      } catch (kvErr) {
        console.log('KV not available, trying API:', kvErr);
      }

      // Fallback to API (server-side - works across browsers)
      if (!groupData) {
        try {
          const response = await fetch(`/api/groups/list?groupId=${groupId}`);
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

        // Load gifts for each participant
        const allGifts = {};
        if (groupData.participants) {
          for (const p of groupData.participants) {
            try {
              const giftData = await getGifts(groupId, p.id);
              allGifts[p.id] = giftData || [];
            } catch (err) {
              console.warn(`Failed to load gifts for ${p.id}:`, err);
              allGifts[p.id] = [];
            }
          }
        }
        setGifts(allGifts);
      }
    } catch (err) {
      console.error('Error loading group:', err);
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

  // Only show if drawn
  if (!group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-2xl text-gray-900 mb-4">Auslosung steht noch aus</p>
          <p className="text-gray-600 mb-8">
            Die Wichtel-Paarungen werden angezeigt, sobald der Organisator die Auslosung durchgeführt hat.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  // Helper: check if person wants surprise
  const wantsSurprise = (participantId) => {
    const giftList = gifts[participantId];
    return !giftList || giftList.length === 0;
  };

  // Helper: get the person that gives to this participant
  const getGiverFor = (participantId) => {
    if (!group.pairing) return null;
    for (const [giverId, receiverId] of Object.entries(group.pairing)) {
      if (receiverId === participantId) {
        return group.participants.find(p => p.id === giverId);
      }
    }
    return null;
  };

  // Helper: get person name by ID
  const getPersonName = (participantId) => {
    const person = group.participants.find(p => p.id === participantId);
    return person ? person.name : 'Unbekannt';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600">
              🎁 Wichtel-Paarungen
            </h1>
            <span className="inline-block bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-xl text-gray-700">{group.name}</p>
          <p className="text-gray-600">Budget: {group.budget}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
            <p className="text-sm text-gray-700">
              <strong>💡 Hinweis:</strong> Klick auf einen Namen, um die Wunschliste dieser Person zu sehen.
              Falls jemand "überrascht werden" möchte, wird das hier angezeigt.
            </p>
          </div>

          {/* Pairings List */}
          <div className="space-y-4">
            {group.participants && group.participants.length > 0 ? (
              group.participants.map((participant) => {
                const recipient = group.pairing?.[participant.id];
                const recipientName = recipient ? getPersonName(recipient) : 'Nicht zugewiesen';
                const wantsSurpriseFlag = wantsSurprise(recipient);
                const isExpanded = expandedPerson === participant.id;

                return (
                  <div key={participant.id} className="space-y-2">
                    {/* Pairing Card */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-red-500 hover:shadow-lg transition">
                      <div className="p-6">
                        <div className="flex items-center justify-between gap-6">
                          {/* Giver */}
                          <div className="flex-1 text-center">
                            <div className="text-3xl mb-2">👤</div>
                            <p className="font-bold text-gray-900 text-lg">{participant.name}</p>
                          </div>

                          {/* Arrow */}
                          <div className="text-2xl text-red-500 flex-shrink-0">
                            🎁 ➜
                          </div>

                          {/* Recipient */}
                          <div className="flex-1">
                            <button
                              onClick={() => setExpandedPerson(isExpanded ? null : participant.id)}
                              className="w-full text-center hover:bg-gray-50 rounded-lg p-2 transition group"
                            >
                              <div className="text-3xl mb-2 group-hover:scale-110 transition">👤</div>
                              <p className="font-bold text-gray-900 text-lg">{recipientName}</p>
                              {wantsSurpriseFlag ? (
                                <p className="text-xs text-purple-600 font-semibold mt-1">🎉 Überraschung!</p>
                              ) : (
                                <p className="text-xs text-blue-600 font-semibold mt-1">📋 Klick für Liste</p>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Gift List */}
                      {isExpanded && (
                        <div className="bg-gray-50 border-t border-gray-200 p-6">
                          {wantsSurpriseFlag ? (
                            // Surprise message
                            <div className="text-center py-8">
                              <div className="text-6xl mb-4">🎉</div>
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Überraschungs-Zeit!
                              </h3>
                              <p className="text-gray-700">
                                {recipientName} möchte sich überraschen lassen und hat keine Wunschliste angelegt.
                                Das gibt dir Freiheit, etwas Kreatives auszusuchen!
                              </p>
                              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mt-4 text-left">
                                <p className="text-sm text-gray-700 font-semibold mb-2">✨ Tipps:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  <li>💡 Budget: {group.budget}</li>
                                  <li>💡 Persönliche Interessen berücksichtigen</li>
                                  <li>💡 Kreativ und liebevoll auswählen</li>
                                </ul>
                              </div>
                            </div>
                          ) : (
                            // Gift list
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {recipientName}s Wunschliste
                              </h3>
                              <GiftList
                                group={group}
                                groupId={groupId}
                                participantId={recipient}
                                isViewing={true}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                Keine Teilnehmer vorhanden
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-sm text-gray-700">
              <strong>✅ Viel Spaß beim Einkaufen!</strong>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Denk dran: Alle Geschenke sollten bis zum {new Date(group.endDate).toLocaleDateString('de-DE')} ankommen!
            </p>
          </div>

          {/* Back Link */}
          <div className="text-center mt-8">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
