import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { isAdminLoggedIn } from '../../../lib/admin';

export default function AdminGroupDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gifts, setGifts] = useState({});

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      router.push('/admin/login');
      return;
    }

    if (id) {
      loadGroupData();
    }
  }, [id]);

  const loadGroupData = () => {
    try {
      setLoading(true);
      const groupData = localStorage.getItem(`group_${id}`);
      if (groupData) {
        setGroup(JSON.parse(groupData));

        // Load gifts for each participant
        const allGifts = {};
        const parsed = JSON.parse(groupData);
        if (parsed.participants) {
          parsed.participants.forEach((p) => {
            const giftData = localStorage.getItem(
              `group:${id}:gifts:${p.id}`
            );
            allGifts[p.id] = giftData ? JSON.parse(giftData) : [];
          });
        }
        setGifts(allGifts);
      }
    } catch (err) {
      console.error('Error loading group:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl">🔄 Lädt...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl mb-4">❌ Gruppe nicht gefunden</p>
          <a
            href="/admin/dashboard"
            className="text-blue-400 hover:underline"
          >
            ← Zurück zum Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-6">
        <div className="container mx-auto">
          <a
            href="/admin/dashboard"
            className="text-blue-400 hover:underline mb-4 inline-block"
          >
            ← Zurück
          </a>
          <h1 className="text-4xl font-bold text-white mb-1">{group.name}</h1>
          <p className="text-gray-400 font-mono">{group.id}</p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Group Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-400 text-sm">Budget</p>
            <p className="text-2xl font-bold text-white">{group.budget}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-400 text-sm">Teilnehmer</p>
            <p className="text-2xl font-bold text-white">
              {group.participants?.length || 0}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-400 text-sm">Status</p>
            <p className="text-2xl font-bold text-white">
              {group.drawn ? '✅ Ausgelost' : '⏳ Offen'}
            </p>
          </div>
        </div>

        {/* Created Date */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border-b border-gray-700">
          <p className="text-gray-400 text-sm mb-2">Erstellt am</p>
          <p className="text-white font-mono">{formatDate(group.createdAt)}</p>
        </div>

        {/* Participants */}
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700 bg-gray-750">
            <h2 className="text-2xl font-bold text-white">👥 Teilnehmer</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {group.participants && group.participants.length > 0 ? (
              group.participants.map((p) => (
                <div key={p.id} className="p-6 hover:bg-gray-750 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xl font-semibold text-white">
                        {p.name}
                      </p>
                      <p className="text-gray-400 text-sm font-mono">{p.id}</p>
                    </div>
                    {group.drawn && group.pairing && group.pairing[p.id] && (
                      <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                        🎁 → {group.participants.find(x => x.id === group.pairing[p.id])?.name}
                      </div>
                    )}
                  </div>

                  {/* Gifts */}
                  {gifts[p.id] && gifts[p.id].length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-gray-400 text-sm font-semibold">
                        Geschenkeliste ({gifts[p.id].length}):
                      </p>
                      <ul className="space-y-1">
                        {gifts[p.id].map((gift, idx) => (
                          <li key={idx} className="text-gray-300 text-sm ml-4">
                            • <span className="font-medium">{gift.name}</span>
                            {gift.price && (
                              <span className="text-gray-500 ml-2">
                                ({gift.price})
                              </span>
                            )}
                            {gift.link && (
                              <a
                                href={gift.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline ml-2"
                              >
                                🔗
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-400">Keine Teilnehmer</p>
              </div>
            )}
          </div>
        </div>

        {/* Ausschlüsse */}
        {group.exclusions && Object.keys(group.exclusions).length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-700 bg-gray-750">
              <h2 className="text-2xl font-bold text-white">🚫 Ausschlüsse</h2>
            </div>
            <div className="p-6">
              <ul className="space-y-2">
                {Object.entries(group.exclusions).map(([key, value]) => {
                  const [fromId, toId] = key.split('-');
                  const from = group.participants?.find(
                    (p) => p.id === fromId
                  );
                  const to = group.participants?.find((p) => p.id === toId);
                  return (
                    <li key={key} className="text-gray-300">
                      🚫 <strong>{from?.name}</strong> ≠{' '}
                      <strong>{to?.name}</strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
