import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrganizerDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState(null);
  const [gifts, setGifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroupData();
      // Refresh data every 10 seconds
      const interval = setInterval(loadGroupData, 10000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const loadGroupData = () => {
    try {
      const groupData = localStorage.getItem(`group_${id}`);
      if (groupData) {
        const parsed = JSON.parse(groupData);
        setGroup(parsed);

        // Load gifts for each participant
        const allGifts = {};
        if (parsed.participants) {
          parsed.participants.forEach((p) => {
            const giftData = localStorage.getItem(`group:${id}:gifts:${p.id}`);
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

  const getOrganizerLink = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/organizer/${id}`;
  };

  const getParticipantLink = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${id}`;
  };

  const [copiedType, setCopiedType] = useState(null);

  const copyToClipboard = (linkType = 'organizer') => {
    const link = linkType === 'participant' ? getParticipantLink() : getOrganizerLink();
    navigator.clipboard.writeText(link);
    setCopiedType(linkType);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const sendViaEmail = () => {
    const link = getOrganizerLink();
    const subject = encodeURIComponent(`${group?.name} - Organisator-Dashboard`);
    const body = encodeURIComponent(
      `Hier ist der Link zu meinem Organisator-Dashboard für die Wichtelgruppe "${group?.name}":\n\n${link}\n\nDarauf kann ich sehen, ob alle Teilnehmer ihre Geschenkelisten ausgefüllt haben.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const getParticipantStatus = (participantId) => {
    const hasList = gifts[participantId] && gifts[participantId].length > 0;
    return {
      hasGifts: hasList,
      giftCount: gifts[participantId]?.length || 0,
    };
  };

  const completionStats = () => {
    if (!group?.participants) return { completed: 0, total: 0 };
    const completed = group.participants.filter(
      (p) => getParticipantStatus(p.id).hasGifts
    ).length;
    return {
      completed,
      total: group.participants.length,
      percentage: Math.round((completed / group.participants.length) * 100),
    };
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
          <Link href="/">
            <a className="text-blue-600 hover:underline">← Zurück zur Startseite</a>
          </Link>
        </div>
      </div>
    );
  }

  const stats = completionStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 mb-2">
            🎯 Organisator Dashboard
          </h1>
          <p className="text-xl text-gray-700 mb-1">{group.name}</p>
          <p className="text-gray-600">Überblick über den Status deiner Wichtelgruppe</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Left Column - Link & Email */}
          <div className="lg:col-span-1">
            {/* Link Card */}
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-lg mb-6">
              <h3 className="section-title text-blue-900 mb-4">🔗 Dein Organisations-Link</h3>

              <p className="text-sm text-gray-700 mb-3">
                Speichere diesen Link als Lesezeichen oder sende ihn dir per Email, um jederzeit deinen Überblick zu sehen:
              </p>

              <div className="bg-white rounded border border-blue-300 p-3 mb-4 font-mono text-xs break-all">
                {getOrganizerLink()}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard('organizer')}
                  className="w-full btn-secondary bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  {copiedType === 'organizer' ? '✅ Kopiert!' : '📋 Link kopieren'}
                </button>

                <button
                  onClick={sendViaEmail}
                  className="w-full btn-secondary bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  📧 Per Email senden
                </button>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-gray-700">
                <strong>💡 Tipp:</strong> Speichere diesen Link als Lesezeichen (Strg+D / Cmd+D) in deinem Browser, um schnell darauf zurückzukommen.
              </div>
            </div>

            {/* Group Info Card */}
            <div className="card bg-white shadow-lg">
              <h3 className="section-title mb-4">📋 Gruppen-Infos</h3>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500 font-semibold">Budget</p>
                  <p className="text-xl font-bold text-gray-900">{group.budget}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold">Anlass</p>
                  <p className="text-gray-800">{group.occasion || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold">Enddatum</p>
                  <p className="text-gray-800">
                    {new Date(group.endDate).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold">Status</p>
                  <p className="text-lg">
                    {group.drawn ? '✅ Ausgelost' : '⏳ Ausstehend'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Participant Status */}
          <div className="lg:col-span-2">
            {/* Completion Progress */}
            <div className="card bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 shadow-lg mb-6">
              <h3 className="section-title text-green-900 mb-4">
                ✅ Fortschritt: Geschenkelisten
              </h3>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800">
                    {stats.completed} von {stats.total} Teilnehmern fertig
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {stats.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>

              {stats.percentage === 100 ? (
                <div className="p-3 bg-green-100 border border-green-400 rounded text-green-900 text-sm font-semibold">
                  🎉 Alle Teilnehmer haben ihre Geschenkelisten eingegeben! Du kannst jetzt auslosen.
                </div>
              ) : (
                <div className="p-3 bg-blue-100 border border-blue-400 rounded text-blue-900 text-sm">
                  🔄 Warte auf die restlichen Teilnehmer...
                </div>
              )}
            </div>

            {/* Participant List */}
            <div className="card shadow-lg">
              <h3 className="section-title mb-4">👥 Teilnehmerstatus</h3>

              {group.participants && group.participants.length > 0 ? (
                <div className="space-y-3">
                  {group.participants.map((participant) => {
                    const status = getParticipantStatus(participant.id);
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300 hover:bg-gray-100 transition"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {participant.name}
                          </p>
                          {participant.email && (
                            <p className="text-xs text-gray-500">{participant.email}</p>
                          )}
                        </div>

                        <div className="text-right">
                          {status.hasGifts ? (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">✅</span>
                              <div>
                                <p className="font-bold text-green-600">
                                  {status.giftCount} Geschenke
                                </p>
                                <p className="text-xs text-gray-500">Fertig</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">⏳</span>
                              <div>
                                <p className="font-bold text-orange-600">Ausstehend</p>
                                <p className="text-xs text-gray-500">Keine Liste</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">Keine Teilnehmer</p>
              )}
            </div>
          </div>
        </div>

        {/* Participant Link Section */}
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg mb-6">
          <h3 className="section-title text-purple-900 mb-4">📤 Teilnehmer einladen</h3>

          <p className="text-sm text-gray-700 mb-4">
            Versende diesen Link an deine Freunde, Familie oder Kollegen, damit sie sich anmelden und ihre Wunschliste erstellen können:
          </p>

          <div className="bg-white rounded border border-purple-300 p-4 mb-4 font-mono text-xs break-all">
            {getParticipantLink()}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard('participant')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition"
            >
              {copiedType === 'participant' ? '✅ Link kopiert!' : '📋 Link in Zwischenablage'}
            </button>

            <div className="relative group">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition">
                📲 Link teilen
              </button>
              <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 right-0 mt-2 w-40 z-10 flex-col gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Wichtel Gruppe: ${getParticipantLink()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`mailto:?body=${encodeURIComponent(`Teilnahmelink: ${getParticipantLink()}`)}`}
                  className="hover:text-blue-400"
                >
                  📧 Email
                </a>
                <button
                  onClick={() => {
                    const text = `Wichtel Gruppe: ${getParticipantLink()}`;
                    navigator.clipboard.writeText(text);
                    alert('Nachricht kopiert!');
                  }}
                  className="text-left hover:text-yellow-400"
                >
                  📌 Nachricht kopieren
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded text-xs text-purple-900">
            <strong>💡 Hinweis:</strong> Teile diesen Link per WhatsApp, Signal, Threema, Email oder andere Messenger, um deine Teilnehmer einzuladen!
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/join/${id}`}>
              <a className="block text-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
                🔗 Zum Beitritts-Link
              </a>
            </Link>

            {stats.percentage === 100 && !group.drawn && (
              <Link href={`/organizer/${id}/draw`}>
                <a className="block text-center p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
                  🎲 Jetzt auslosen
                </a>
              </Link>
            )}

            <Link href="/">
              <a className="block text-center p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
                🏠 Zur Startseite
              </a>
            </Link>
          </div>

          {!group.drawn && (
            <p className="text-center text-sm text-gray-700 mt-4">
              ℹ️ Das Auslosen ist nur möglich, wenn alle Teilnehmer ihre Geschenkelisten eingegeben haben.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
