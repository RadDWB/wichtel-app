import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../lib/kv-client';

export default function OrganizerDashboard() {
  const router = useRouter();
  const { id, showPin } = router.query;
  const [group, setGroup] = useState(null);
  const [gifts, setGifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pinShown, setPinShown] = useState(!!showPin);
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (id) {
      // Check if authenticated via PIN
      checkAuthentication();
      // Refresh data every 10 seconds
      const interval = setInterval(() => {
        if (authenticated) {
          loadGroupData();
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [id, authenticated]);

  const checkAuthentication = () => {
    // Check if coming from initial setup (showPin in URL)
    if (showPin) {
      setAuthenticated(true);
      return;
    }

    // Check localStorage for verification
    const stored = localStorage.getItem(`organizer_${id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.pin && parsed.verifiedAt) {
          setAuthenticated(true);
          return;
        }
      } catch (e) {
        console.error('Invalid stored auth:', e);
      }
    }

    // Not authenticated
    setAuthenticated(false);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    if (!pinInput.trim()) {
      setPinError('Bitte gib deine PIN ein');
      return;
    }

    try {
      // Verify PIN against group
      let groupData = await getGroup(id);

      if (!groupData || groupData.organizerPin !== pinInput.trim()) {
        setPinError('❌ PIN ist ungültig');
        setPinInput('');
        return;
      }

      // PIN correct
      localStorage.setItem(`organizer_${id}`, JSON.stringify({
        pin: pinInput.trim(),
        verifiedAt: new Date().toISOString()
      }));

      setAuthenticated(true);
      loadGroupData();
    } catch (err) {
      setPinError('Fehler beim Überprüfen der PIN');
      console.error(err);
    }
  };

  const loadGroupData = async () => {
    try {
      let groupData = null;

      // Try KV first (primary)
      try {
        groupData = await getGroup(id);
        if (groupData) {
          console.log('✅ Group loaded from KV');
        }
      } catch (kvErr) {
        console.log('KV not available, trying API:', kvErr);
      }

      // Fallback to API (server-side - works across browsers)
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

        // Load gifts for each participant (from KV)
        const allGifts = {};
        if (groupData.participants) {
          for (const p of groupData.participants) {
            try {
              const giftData = await getGifts(id, p.id);
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

  const getOrganizerLink = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/organizer/${id}`;
  };

  const getParticipantLink = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${id}`;
  };

  const getPairingsLink = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/${id}/pairings`;
  };

  const [copiedType, setCopiedType] = useState(null);

  const copyToClipboard = (linkType = 'organizer') => {
    let link = '';
    if (linkType === 'participant') {
      link = getParticipantLink();
    } else if (linkType === 'pairings') {
      link = getPairingsLink();
    } else {
      link = getOrganizerLink();
    }
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

  // Check if organizer is participating
  const getOrganizerParticipant = () => {
    if (!group?.participants) return null;
    return group.participants.find(p => p.id.startsWith('organizer-'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">🔄 Lädt...</p>
      </div>
    );
  }

  // PIN authentication required (unless coming from initial setup)
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔐</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Zugang</h1>
              <p className="text-gray-600">Gib deine PIN ein</p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-6">
              {pinError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {pinError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deine 3-stellige PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength="3"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="●●●"
                  className="input-field w-full text-center text-4xl font-bold tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Diese PIN hast du beim Erstellen der Gruppe erhalten
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition"
              >
                🔓 Dashboard entsperren
              </button>

              <Link href="/" className="block text-center text-blue-600 hover:underline text-sm">
                ← Zurück zur Startseite
              </Link>
            </form>
          </div>
        </div>
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

  const stats = completionStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* PIN Alert - nur beim ersten Mal zeigen */}
        {pinShown && showPin && (
          <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✅</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-green-900 mb-2">🎉 Gruppe erstellt!</h3>
                <p className="text-green-800 mb-4">
                  Speichere deine persönliche PIN auf, um später auf diese Gruppe zuzugreifen:
                </p>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 font-semibold mb-2">Deine Gruppen-PIN:</p>
                  <p className="text-5xl font-black text-green-600 text-center tracking-widest">{showPin}</p>
                </div>
                <p className="text-sm text-green-700">
                  💡 <strong>Hinweis:</strong> Du brauchst diese PIN + deine Gruppen-ID, um dich später wieder anmelden zu können. Notiere sie dir oder mache einen Screenshot!
                </p>
                <button
                  onClick={() => setPinShown(false)}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  ✅ Verstanden
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 mb-2">
            🎯 Organisator Dashboard
          </h1>
          <p className="text-xl text-gray-700 mb-1">{group.name}</p>
          <p className="text-gray-600">Überblick über den Status deiner Wichtelgruppe</p>
          <p className="text-sm text-gray-500 mt-2 font-mono">ID: {id}</p>
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
              <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 right-0 mt-2 w-48 z-10 flex-col gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Wichtelgruppe "${group?.name}": ${getParticipantLink()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 block"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Wichtelgruppe "${group?.name}": ${getParticipantLink()}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 block text-xs"
                >
                  💬 WhatsApp (App)
                </a>
                <a
                  href={`mailto:?body=${encodeURIComponent(`Wichtelgruppe "${group?.name}":\n\n${getParticipantLink()}`)}`}
                  className="hover:text-blue-400 block"
                >
                  📧 Email
                </a>
                <button
                  onClick={() => {
                    const text = `Wichtelgruppe "${group?.name}": ${getParticipantLink()}`;
                    navigator.clipboard.writeText(text);
                    setCopiedType('share');
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="text-left hover:text-yellow-400 block"
                >
                  {copiedType === 'share' ? '✅ Kopiert!' : '📌 Text kopieren'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded text-xs text-purple-900">
            <strong>💡 Hinweis:</strong> Teile diesen Link per WhatsApp, Signal, Threema, Email oder andere Messenger, um deine Teilnehmer einzuladen!
          </div>
        </div>

        {/* Pairings Share Section (after draw) */}
        {group.drawn && (
          <div className="card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 shadow-lg mb-6">
            <h3 className="section-title text-purple-900 mb-4">🎁 Paarungen teilen</h3>

            <p className="text-sm text-gray-700 mb-4">
              Teile diese Seite mit allen Teilnehmern, damit sie sehen können, wer wen beschenkt und die Wunschlisten einsehen können:
            </p>

            <div className="bg-white rounded border border-purple-300 p-4 mb-4 font-mono text-xs break-all">
              {getPairingsLink()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => copyToClipboard('pairings')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition"
              >
                {copiedType === 'pairings' ? '✅ Link kopiert!' : '📋 Link in Zwischenablage'}
              </button>

              <div className="relative group">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition">
                  📲 Link teilen
                </button>
                <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 right-0 mt-2 w-48 z-10 flex-col gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Schaut die Wichtel-Paarungen an! ${getPairingsLink()}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 block"
                  >
                    💬 WhatsApp
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Schaut die Wichtel-Paarungen an! ${getPairingsLink()}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 block"
                  >
                    💬 WhatsApp (App)
                  </a>
                  <a
                    href={`mailto:?body=${encodeURIComponent(`Schaut die Wichtel-Paarungen an:\n\n${getPairingsLink()}`)}`}
                    className="hover:text-blue-400 block"
                  >
                    📧 Email
                  </a>
                </div>
              </div>

              <button
                onClick={() => {
                  const text = `Schaut die Wichtel-Paarungen an! ${getPairingsLink()}`;
                  navigator.share({ title: 'Wichtel-Paarungen', text: text }).catch(() => {});
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-semibold transition"
              >
                🔗 Share-Button
              </button>
            </div>

            <div className="mt-4 p-3 bg-purple-100 border border-purple-300 rounded text-xs text-purple-900">
              <strong>💡 Hinweis:</strong> Auf dieser Seite können deine Teilnehmer sehen, wer wen beschenkt. Klick auf einen Namen, um die Wunschliste zu sehen. Falls jemand sich überraschen lassen möchte, wird das dort angezeigt.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 shadow-lg">
          <div className={`grid gap-4 ${getOrganizerParticipant() ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* Quick Access to Organizer's Own Gift List */}
            {getOrganizerParticipant() && (
              <div className="relative group">
                <Link href={`/join/${id}?orgParticipant=${getOrganizerParticipant().id}`} className="block text-center p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition shadow-lg">
                  🎁 Meine Wunschliste
                </Link>
                <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 left-0 mt-2 w-56 z-10 flex-col gap-1">
                  <p className="font-semibold">Du nimmst auch teil!</p>
                  <p>Klick hier, um deine eigene Wunschliste zu erstellen.</p>
                </div>
              </div>
            )}

            <Link href={`/join/${id}`} className="block text-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
              🔗 Zum Beitritts-Link
            </Link>

            {stats.percentage === 100 && !group.drawn && (
              <Link href={`/organizer/${id}/draw`} className="block text-center p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
                🎲 Jetzt auslosen
              </Link>
            )}

            <Link href="/" className="block text-center p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
              🏠 Zur Startseite
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
