import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../../lib/kv-client';
import GiftList from '../../../components/GiftList';
import AmazonFilterSelector from '../../../components/AmazonFilterSelector';

export default function GiftPage() {
  const router = useRouter();
  const { groupId, participantId } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId && participantId) {
      loadGroupData();
    }
  }, [groupId, participantId]);

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

  const partner = group.participants.find(p => p.id === participantId);

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-900 mb-4">❌ Teilnehmer nicht gefunden</p>
          <Link href={`/${groupId}/pairings`} className="text-blue-600 hover:underline">
            ← Zurück zu Paarungen
          </Link>
        </div>
      </div>
    );
  }

  // If partner explicitly wants a surprise, show special message
  const partnerWantsSurprise = partner?.wantsSurprise === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">🎁 Du wichtelst für:</h1>
            <p className="text-3xl font-bold">{partner.name}</p>
            <p className="text-sm mt-2 opacity-90">Budget: {group.budget}</p>
          </div>

          {partnerWantsSurprise ? (
            // Partner wants surprise - show Amazon filters first, then surprise message
            <>
              {/* Amazon Shopping Filters - Directly under header */}
              <div className="mb-6">
                <AmazonFilterSelector
                  preselectedPrice="20-30"
                  compact={false}
                />
              </div>

              {/* Surprise Message Section */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center mb-6 border-l-4 border-purple-400">
                <div className="text-4xl mb-3">🎉</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-900">Überraschungs-Zeit!</h2>

                <p className="text-sm text-gray-600 mb-4 max-w-lg mx-auto font-medium">
                  {partner.name} hat sich bewusst für eine Überraschung entschieden und keine Wunschliste angelegt.
                </p>

                {/* Amazon Filter Explanation */}
                <div className="bg-purple-50 border-l-4 border-purple-400 p-4 text-left">
                  <p className="text-xs text-gray-700 mb-2">
                    Nutze die Filter oben, um perfekte Geschenkideen zu finden – bereits nach deinem Budget vorausgewählt! Kategorie und Zielgruppe helfen dir, das Richtige zu wählen.
                  </p>
                </div>
              </div>
            </>
          ) : (
            // Partner has submitted gift list - show it
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h2 className="text-2xl font-bold mb-6">{partner.name}s Geschenkeliste</h2>

              {/* Gifts will be loaded here */}
              <GiftList
                group={group}
                groupId={groupId}
                participantId={participantId}
                isViewing={true}
              />
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link
              href={`/${groupId}/pairings`}
              className="inline-block px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
            >
              ← Zurück zu allen Paarungen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
