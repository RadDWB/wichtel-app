import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../../lib/kv-client';
import GiftList from '../../../components/GiftList';
import AmazonFilterSelector from '../../../components/AmazonFilterSelector';
import { APP_VERSION } from '../../../lib/constants';

// Universal recovery PIN for forgotten participant PINs
const RECOVERY_PIN = '999999';

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
  const [pinRequired, setPinRequired] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (groupId && participantId) {
      loadData();
      // Check if participant has a PIN set
      const storedPin = localStorage.getItem(`participant_pin_${groupId}_${participantId}`);
      if (storedPin) {
        setPinRequired(true);
      }
    }
  }, [groupId, participantId]);

  const handlePinSubmit = async () => {
    const storedPin = localStorage.getItem(`participant_pin_${groupId}_${participantId}`);
    if (storedPin === pinInput.trim() || pinInput.trim() === RECOVERY_PIN) {
      setPinVerified(true);
      setPinError('');
    } else {
      setPinError('❌ PIN ist falsch');
      setPinInput('');
    }
  };

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

  // PIN verification screen if PIN is required and not verified
  if (pinRequired && !pinVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">PIN erforderlich</h2>
            <p className="text-gray-600">
              Diese Liste ist mit einer PIN geschützt. Gib deine PIN ein, um fortzufahren.
            </p>
          </div>

          {pinError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {pinError}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
              placeholder="Gib deine 4-6 stellige PIN ein"
              className="w-full border-2 border-gray-300 rounded-lg p-3 text-lg font-mono text-center"
              autoFocus
            />
          </div>

          <button
            onClick={handlePinSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition mb-4"
          >
            ✅ PIN prüfen
          </button>

          <Link href={`/${groupId}/pairings`} className="block text-center text-blue-600 hover:underline text-sm">
            ← Zurück zur Paarungsliste
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
            <h1 className="text-4xl font-bold text-gray-900">
              🎁 Du beschenst {partner.name}
            </h1>
          </div>
          <p className="text-xl text-gray-700 mb-2">{group.name}</p>
          <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 inline-block mt-4">
            <p className="text-lg font-semibold text-gray-800">💰 Budget: {group.budget}</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          {gifts.length === 0 && wantsSurprise ? (
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
