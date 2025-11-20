import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../../lib/kv-client';
import GiftList from '../../../components/GiftList';
import AmazonFilterSelector from '../../../components/AmazonFilterSelector';
import { APP_VERSION } from '../../../lib/constants';

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

export default function PartnerDetailPage() {
  const router = useRouter();
  const { groupId, participantId } = router.query;
  const [group, setGroup] = useState(null);
  const [partner, setPartner] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId && participantId) {
      loadData();
    }
  }, [groupId, participantId]);

  const loadData = async () => {
    try {
      let groupData = null;
      try {
        groupData = await getGroup(groupId);
      } catch (kvErr) {
        console.log('KV not available, trying API:', kvErr);
      }

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

        // Find the partner
        const foundPartner = groupData.participants.find(p => p.id === participantId);
        if (foundPartner) {
          setPartner(foundPartner);

          // Load gifts for this participant
          try {
            const giftData = await getGifts(groupId, participantId);
            setGifts(giftData || []);
          } catch (err) {
            console.error('Error loading gifts:', err);
            setGifts([]);
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if partner wants surprise
  const wantsSurprise = !gifts || gifts.length === 0;

  // Get preselected budget for Amazon filters
  const preselectedPrice = getBudgetPriceRange(group?.budget);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">🔄 Lädt...</p>
      </div>
    );
  }

  if (!group || !partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-2xl text-gray-900 mb-4">Partner nicht gefunden</p>
          <Link href={`/${groupId}/pairings`} className="text-blue-600 hover:underline">
            ← Zurück zu den Paarungen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600">
              🎁 {partner.name}s Profil
            </h1>
            <span className="inline-block bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-xl text-gray-700">{group.name}</p>
          <p className="text-gray-600">Budget: {group.budget}</p>
        </div>

        <div className="max-w-3xl mx-auto">
          {wantsSurprise ? (
            // Surprise message with Amazon Filters
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-3xl font-bold text-purple-600 mb-4">Überraschungs-Zeit!</h2>
                <p className="text-lg text-gray-700 mb-6">
                  {partner.name} möchte sich überraschen lassen und hat bewusst keine Wunschliste angelegt.
                </p>
                <p className="text-gray-600">
                  Das gibt dir volle Freiheit, etwas Kreatives und Liebevolles auszusuchen! 💝
                </p>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8 text-left">
                <p className="text-lg font-bold text-purple-900 mb-4">✨ Tipps für die Wahl:</p>
                <ul className="text-gray-700 space-y-2">
                  <li>💡 Budget: <strong>{group.budget}</strong></li>
                  <li>💡 Denke an persönliche Interessen von {partner.name}</li>
                  <li>💡 Sei kreativ und liebevoll bei der Auswahl</li>
                  <li>💡 Überraschungsgeschenke sind oft die besten! 🎁</li>
                </ul>
              </div>

              {/* Amazon Filters for Surprise */}
              <AmazonFilterSelector preselectedPrice={preselectedPrice} />
            </div>
          ) : (
            // Gift list
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">📋 {partner.name}s Wunschliste</h2>

              <div className="mb-8">
                <GiftList
                  group={group}
                  groupId={groupId}
                  participantId={participantId}
                  isViewing={true}
                />
              </div>

              {/* Amazon Filters for Gift List */}
              <div className="mt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">🛍️ Konntest du das perfekte Geschenk nicht finden?</h3>
                <p className="text-gray-700 mb-6">
                  Nutze unsere intelligenten Filter, um auf Amazon.de nach Alternativen zu suchen:
                </p>
                <AmazonFilterSelector preselectedPrice={preselectedPrice} />
              </div>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link href={`/${groupId}/pairings`} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
            ← Zurück zu den Paarungen
          </Link>
        </div>
      </div>
    </div>
  );
}
