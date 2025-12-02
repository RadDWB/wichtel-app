import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup } from '../../lib/kv-client';
import AmazonFilterSelector from '../../components/AmazonFilterSelector';
import { APP_VERSION } from '../../lib/constants';

// Map budget text to price range keys for the filter
function getBudgetPriceRange(budget) {
  if (!budget) return null;

  const budgetStr = budget.toLowerCase();
  if (budgetStr.includes('5') && !budgetStr.includes('15') && !budgetStr.includes('25') && !budgetStr.includes('50')) return '5-10';
  if (budgetStr.includes('10') && !budgetStr.includes('100')) return '10-15';
  if (budgetStr.includes('15') && !budgetStr.includes('50')) return '15-20';
  if (budgetStr.includes('20')) return '20-30';
  if (budgetStr.includes('30')) return '30-50';
  if (budgetStr.includes('50')) return '50-100';
  if (budgetStr.includes('100')) return '50-100';

  return null;
}

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
            if (groupData.pairing) {
              Object.entries(groupData.pairing).forEach(([fromId, toId]) => {
                const fromParticipant = groupData.participants.find(p => p.id === fromId);
                const toParticipant = groupData.participants.find(p => p.id === toId);
                if (fromParticipant && toParticipant) {
                  pairingList.push({
                    fromId,
                    fromName: fromParticipant.name,
                    toId,
                    toName: toParticipant.name,
                    toWantsSurprise: toParticipant.wantsSurprise, // In Flexible mode
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

  const isMutualMode = group?.settings?.surpriseMode === 'mutual';
  const isFlexibleMode = group?.settings?.surpriseMode === 'flexible';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück
          </Link>

          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">🎁 Hier sind die Paarungen</h1>
            <p className="text-lg">{group?.name}</p>
            <p className="text-sm mt-2 opacity-90">Wichteladministrator: {group?.organizerName}</p>
          </div>

          {error && (
            <div className="bg-orange-100 border-l-4 border-orange-400 p-4 rounded mb-8">
              <p className="text-orange-800">{error}</p>
            </div>
          )}

          {!error && pairings.length > 0 && (
            <>
              {/* Budget Anzeige - Oben */}
              {group?.settings?.budget && (
                <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 mb-8 shadow-md">
                  <h3 className="section-title text-orange-900">💰 Budget</h3>
                  <p className="text-xl font-semibold text-gray-800">{group.settings.budget}</p>
                </div>
              )}

              {/* Pairings Kacheln */}
              <div className="mb-12">
                {isMutualMode && (
                  <p className="text-center text-gray-600 mb-6 text-sm">Alle können diese Paarungen sehen</p>
                )}

                {isFlexibleMode && (
                  <p className="text-center text-gray-600 mb-6 text-sm">Klicke auf deinen Namen um die Wunschliste deines Wichtelpartners zu sehen</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pairings.map((pairing, index) => (
                    <div
                      key={index}
                      className={`card transition-all ${
                        isFlexibleMode
                          ? 'border-2 border-blue-300 bg-white hover:shadow-lg cursor-pointer hover:border-blue-500 transform hover:scale-105'
                          : 'border-2 border-red-300 bg-white shadow-md'
                      }`}
                      onClick={() => {
                        if (isFlexibleMode) {
                          router.push(`/${groupId}/pairings/${pairing.fromId}`);
                        }
                      }}
                    >
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-3">{pairing.fromName}</p>
                        <p className="text-4xl mb-3">🎁</p>
                        <p className="text-sm text-gray-600 mb-3">beschenkt</p>
                        <p className="text-lg font-semibold text-red-600">{pairing.toName}</p>

                        {isFlexibleMode && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold text-blue-600">
                              {pairing.toWantsSurprise ? '🎊 Überraschung!' : '📝 Wunschliste'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amazon Filter - Nur für Public Pairings */}
              <div className="mt-12 pt-8 border-t-2 border-gray-300">
                <h3 className="section-title mb-6">🛍️ Geschenkideen auf Amazon</h3>
                <AmazonFilterSelector preselectedPrice={getBudgetPriceRange(group?.settings?.budget)} />
              </div>
            </>
          )}

          {!error && pairings.length === 0 && (
            <div className="bg-blue-100 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-blue-800">Keine Paarungen verfügbar</p>
            </div>
          )}

          <div className="max-w-4xl mx-auto mt-12 text-center text-sm text-gray-600">
            <p>Wichtel v{APP_VERSION}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
