import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../../lib/kv-client';
import GiftList from '../../../components/GiftList';
import { APP_VERSION } from '../../../lib/constants';

// Amazon Affiliate Links with different budget ranges
const AMAZON_AFFILIATE_LINKS = {
  all: 'https://www.amazon.de/s?k=geschenkideen&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl',
  lowBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A500-1500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl',
  mediumBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A2000-3000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl',
  highBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A5000-10000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl',
};

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
            // Surprise message
            <div className="bg-white rounded-lg shadow-lg p-12 mb-8">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-3xl font-bold text-purple-600 mb-4">Überraschungs-Zeit!</h2>
                <p className="text-lg text-gray-700 mb-6">
                  {partner.name} möchte sich überraschen lassen und hat bewusst keine Wunschliste angelegt.
                </p>
                <p className="text-gray-600 mb-8">
                  Das gibt dir volle Freiheit, etwas Kreatives und Liebevolles auszusuchen! 💝
                </p>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8 text-left">
                  <p className="text-lg font-bold text-purple-900 mb-4">✨ Tipps für die Wahl:</p>
                  <ul className="text-gray-700 space-y-2 mb-4">
                    <li>💡 Budget: <strong>{group.budget}</strong></li>
                    <li>💡 Denke an persönliche Interessen von {partner.name}</li>
                    <li>💡 Sei kreativ und liebevoll bei der Auswahl</li>
                    <li>💡 Überraschungsgeschenke sind oft die besten! 🎁</li>
                  </ul>
                </div>

                {/* Amazon Link for Surprise */}
                <a
                  href={getAmazonLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full md:w-auto text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 shadow-lg text-lg mb-6"
                >
                  🛍️ Auf Amazon.de stöbern
                </a>

                <p className="text-xs text-gray-600">
                  Wir nehmen am Amazon Affiliate Programm teil – Sie unterstützen uns durch Ihren Einkauf!
                </p>
              </div>
            </div>
          ) : (
            // Gift list
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">📋 {partner.name}s Wunschliste</h2>

              <div className="mb-8">
                <GiftList
                  group={group}
                  groupId={groupId}
                  participantId={participantId}
                  isViewing={true}
                />
              </div>

              {/* Amazon Link for Gift List */}
              <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 mt-8">
                <h3 className="text-xl font-bold text-orange-900 mb-3">🛍️ Jetzt einkaufen</h3>
                <p className="text-gray-700 mb-4">
                  Konntest du das perfekte Geschenk in der Liste nicht finden? Stöbere auf Amazon.de:
                </p>
                <a
                  href={getAmazonLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full md:w-auto text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 shadow-lg"
                >
                  🎁 Zu Amazon.de mit Filtern
                </a>
                <p className="text-xs text-gray-600 mt-4">
                  Budget: <strong>{group.budget}</strong> | Wir nehmen am Amazon Affiliate Programm teil
                </p>
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
