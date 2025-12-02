import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getGroup, getGifts } from '../../lib/kv-client';
import AmazonFilterSelector from '../../components/AmazonFilterSelector';
import PinInput from '../../components/PinInput';
import { APP_VERSION, getInvitationText, getPostDrawShareText } from '../../lib/constants';

// Force SSR to prevent static generation errors
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

// Universal recovery PIN for forgotten participant PINs
const RECOVERY_PIN = '999999';

// Amazon Affiliate Links with different budget ranges
const AMAZON_AFFILIATE_LINKS = {
  // Für verschiedene Preisranges - diese Links leiten zu gefilterten Suchergebnissen
  all: 'https://www.amazon.de/s?k=geschenkideen&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl',
  lowBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A500-1500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl', // 5-15€
  mediumBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A2000-3000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl', // 20-30€
  highBudget: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A5000-10000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl', // 50-100€
};

export default function OrganizerDashboard() {
  const router = useRouter();
  const { id, showPin, admin, drawSuccess } = router.query;
  const [group, setGroup] = useState(null);
  const [gifts, setGifts] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [pinShown, setPinShown] = useState(!!showPin);
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [deletingParticipantId, setDeletingParticipantId] = useState(null);
  const [showPairingsAccordion, setShowPairingsAccordion] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showRecoveryPin, setShowRecoveryPin] = useState(false);
  const [showDrawSuccess, setShowDrawSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      // Admin bypass - no PIN needed
      if (admin === 'true') {
        setAuthenticated(true);
        setLoading(false);
      } else if (showPin) {
        // If showPin in URL, verify it server-side FIRST
        verifyPinServerSide();
      } else {
        // Check if authenticated via PIN from localStorage
        const stored = localStorage.getItem(`organizer_${id}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.pin && parsed.verifiedAt) {
              setAuthenticated(true);
            } else {
              setAuthenticated(false);
            }
          } catch (e) {
            console.error('Invalid stored auth:', e);
            setAuthenticated(false);
          }
        } else {
          setAuthenticated(false);
        }
        // Stop loading spinner so PIN input form appears
        setLoading(false);
      }

      // Check for draw success popup
      if (drawSuccess === 'true') {
        setShowDrawSuccess(true);
      }
    }
  }, [id, showPin, admin, drawSuccess]);

  // Server-side PIN verification
  const verifyPinServerSide = async () => {
    try {
      const response = await fetch('/api/organizer/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: id,
          pin: showPin
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          // PIN is valid - store in localStorage
          localStorage.setItem(`organizer_${id}`, JSON.stringify({
            pin: showPin,
            verifiedAt: new Date().toISOString()
          }));
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          setPinError('❌ Ungültige PIN');
        }
      } else {
        setAuthenticated(false);
        setPinError('❌ Ungültige PIN');
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setAuthenticated(false);
      setPinError('Fehler beim Überprüfen der PIN');
    } finally {
      setLoading(false);
    }
  };

  // Separate effect for loading data when authenticated
  useEffect(() => {
    if (id && authenticated) {
      loadGroupData();

      // Refresh data every 30 seconds (reduced from 10s to decrease flickering on mobile)
      const interval = setInterval(() => {
        loadGroupData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [id, authenticated]);


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

        // Load gifts for each participant in parallel (from KV)
        const allGifts = {};
        if (groupData.participants && groupData.participants.length > 0) {
          // Load all gifts in parallel using Promise.all
          const giftPromises = groupData.participants.map(p =>
            getGifts(id, p.id)
              .then(giftData => ({ participantId: p.id, gifts: giftData || [] }))
              .catch(err => {
                console.warn(`Failed to load gifts for ${p.id}:`, err);
                return { participantId: p.id, gifts: [] };
              })
          );

          const giftResults = await Promise.all(giftPromises);
          giftResults.forEach(({ participantId, gifts }) => {
            allGifts[participantId] = gifts;
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
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/join/${id}`;
  };

  const getPairingsLink = () => {
    return `${typeof window !== 'undefined' ? window.location.origin : ''}/${id}/pairings`;
  };

  const getPairingsShareText = () => getPostDrawShareText(getPairingsLink());

  const [copiedType, setCopiedType] = useState(null);
  const [copiedRecoveryPin, setCopiedRecoveryPin] = useState(false);

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

  const handleDeleteParticipant = async (participantId, participantName) => {
    if (!window.confirm(`⚠️ ${participantName} wirklich aus der Gruppe entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    setDeletingParticipantId(participantId);

    try {
      const response = await fetch(`/api/groups/${id}/participants/${participantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen');
      }

      // Refresh group data
      await loadGroupData();
    } catch (err) {
      console.error('Error deleting participant:', err);
      alert(`❌ Fehler: ${err.message}`);
    } finally {
      setDeletingParticipantId(null);
    }
  };

  // Reset mutual surprise mode selection - allows participant to change their mind
  const handleResetMutualSurpriseSelection = async (participantId, participantName) => {
    if (!window.confirm(`⚠️ Wirklich die Auswahl von "${participantName}" zurücksetzen? Sie können sich dann neu anmelden und eine andere Person wählen.`)) {
      return;
    }

    setDeletingParticipantId(participantId);

    try {
      // Clear participant's localStorage selections on all devices (no direct way)
      // For now, we just clear the PIN so they can re-join and re-select
      const response = await fetch(`/api/groups/${id}/participants/${participantId}/reset-pin`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Zurücksetzen');
      }

      // Refresh group data
      await loadGroupData();
      alert(`✅ Die Auswahl von "${participantName}" wurde zurückgesetzt. Sie können sich jetzt neu anmelden.`);
    } catch (err) {
      console.error('Error resetting participant selection:', err);
      alert(`❌ Fehler: ${err.message}`);
    } finally {
      setDeletingParticipantId(null);
    }
  };

  const getParticipantStatus = (participantId) => {
    const participant = group?.participants?.find(p => p.id === participantId);
    const hasList = gifts[participantId] && gifts[participantId].length > 0;
    const wantsSurprise = participant?.wantsSurprise === true;
    const isJoined = !!participant?.joinedAt || !!participant?.pin || (typeof window !== 'undefined' && !!localStorage.getItem(`participant_pin_${id}_${participant?.id}`));

    return {
      hasGifts: hasList || wantsSurprise, // Count "surprise me" as completed
      giftCount: gifts[participantId]?.length || 0,
      wantsSurprise,
      isJoined,
    };
  };

  const completionStats = () => {
    if (!group?.participants) return { completed: 0, total: 0, percentage: 0, allJoined: false };

    // In mutual surprise mode, check if all are registered (don't need gift lists)
    const isMutualMode = group?.settings?.surpriseMode === 'mutual';

    let completed = 0;
    if (isMutualMode) {
      // In mutual mode, "completed" means registered
      completed = group.participants.filter((p) => getParticipantStatus(p.id).isJoined).length;
    } else {
      // In flexible mode, "completed" means has gifts
      completed = group.participants.filter((p) => getParticipantStatus(p.id).hasGifts).length;
    }

    const allJoined = group.participants.every((p) => getParticipantStatus(p.id).isJoined);

    return {
      completed,
      total: group.participants.length,
      percentage: Math.round((completed / group.participants.length) * 100),
      allJoined,
      isMutualMode,
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
                <PinInput
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="●●●"
                  maxLength="3"
                  autoFocus={true}
                  className="input-field w-full text-center text-4xl font-bold tracking-widest"
                  inputMode="numeric"
                  label="Deine 3-stellige PIN"
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
  const pairingsShareText = getPairingsShareText();

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

        {/* Draw Success Popup - Modal mit Overlay */}
        {showDrawSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">✅</div>
                <h2 className="text-3xl font-bold text-green-600 mb-2">Auslosung erfolgreich!</h2>
                <p className="text-gray-700 text-lg">Die Wichtel-Paarungen wurden generiert.</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6 text-left">
                <p className="text-gray-700 font-semibold mb-3">✨ Was jetzt zu tun ist:</p>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                  <li>Kopiere den Link unten</li>
                  <li>Versende ihn an alle Teilnehmer</li>
                  <li>Alle können nun sehen, wen sie beschenken</li>
                </ol>
              </div>

              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-6 max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-600 font-mono whitespace-pre-wrap break-words">{pairingsShareText}</p>
              </div>

              <button
                onClick={() => {
                  // Copy link to clipboard
                  navigator.clipboard.writeText(pairingsShareText);
                  // Close modal
                  setShowDrawSuccess(false);
                  // Optional: Show feedback (if you want visual confirmation)
                  const btn = event.target;
                  const originalText = btn.innerText;
                  btn.innerText = '✅ Link kopiert!';
                  setTimeout(() => {
                    btn.innerText = originalText;
                  }, 2000);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
              >
                ✅ Okay, ich versende den Link
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600">
              🎯 Organisator Dashboard
            </h1>
            <span className="inline-block bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-xl text-gray-700 mb-1">{group.name}</p>
          <p className="text-gray-600">Überblick über den Status deiner Wichtelgruppe</p>
          <p className="text-sm text-gray-500 mt-2 font-mono">ID: {id}</p>
          {group?.organizerPin && (
            <p className="text-sm text-red-600 mt-2 font-mono font-bold">🔒 PIN: {group.organizerPin}</p>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Left Column - Link & Email */}
          <div className="lg:col-span-1">
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
                <hr className="my-2 border-gray-300" />
                <div>
                  <p className="text-gray-500 font-semibold">Wichtel-Modus</p>
                  <p className="text-gray-800">
                    {group.settings?.surpriseMode === 'mutual' ? '🎊 Gegenseitig überrascht' : '🎁 Flexibel'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-semibold">Paarungen sichtbar</p>
                  <p className="text-gray-800">
                    {group.settings?.pairingVisibility === 'public' ? '🌐 Öffentlich' : '🔒 Privat'}
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
                ✅ Fortschritt: {stats.isMutualMode ? 'Anmeldungen' : 'Geschenkelisten'}
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
                  🎉 {stats.isMutualMode ? 'Alle Teilnehmer haben sich angemeldet!' : 'Alle Teilnehmer haben ihre Geschenkelisten eingegeben!'} Du kannst jetzt auslosen.
                </div>
              ) : (
                <div className="p-3 bg-blue-100 border border-blue-400 rounded text-blue-900 text-sm">
                  🔄 Warte auf die restlichen Teilnehmer... ({100 - stats.percentage}%)
                </div>
              )}
            </div>

            {/* Draw Button - Prominent Placement when 100% */}
            {!group.drawn && stats.percentage === 100 && (
              <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-4 border-red-400 shadow-xl mb-6">
                <h3 className="section-title mb-4 text-red-900">🎲 Auslosung starten</h3>
                <p className="text-sm text-gray-700 mb-6">
                  {stats.isMutualMode ? 'Alle Teilnehmer haben sich angemeldet!' : 'Alle Teilnehmer haben ihre Geschenkelisten eingegeben!'} Die Auslosung ist bereit.
                </p>
                <Link href={`/organizer/${id}/draw`} className="block w-full text-center p-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-bold text-lg transition shadow-lg">
                  🎲 Jetzt auslosen
                </Link>
                <p className="text-xs text-gray-600 text-center mt-3">
                  Klick auf den Button, um die Wichtelpartner zuzulosen und die Paarungen zu verteilen.
                </p>
              </div>
            )}

            {/* Participant List */}
            <div className="card shadow-lg">
              <h3 className="section-title mb-4">👥 Teilnehmerstatus</h3>

              {/* Info for Mutual Mode */}
              {group.settings?.surpriseMode === 'mutual' && (
                <div className="mb-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded">
                  <p className="text-xs text-purple-900">
                    <strong>Gegenseitige Überraschung aktiviert:</strong> Alle Teilnehmer werden überrascht - es gibt keine Wunschlisten. Der Status "Überrascht - Angemeldet" zeigt, wer bereits beigetreten ist.
                  </p>
                </div>
              )}

              {group.participants && group.participants.length > 0 ? (
                <div className="space-y-3">
                  {group.participants.map((participant) => {
                    const status = getParticipantStatus(participant.id);
                    // Check if participant has joined (has joinedAt timestamp)
                    // Fallback to checking PIN for backward compatibility with old data
                    const participantHasJoined = !!participant.joinedAt || !!participant.pin || (typeof window !== 'undefined' && !!localStorage.getItem(`participant_pin_${id}_${participant.id}`));

                    return (
                      <div
                        key={participant.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300 hover:bg-gray-100 transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {participant.name}
                            </p>
                            {participant.email && (
                              <p className="text-xs text-gray-500">{participant.email}</p>
                            )}

                            {/* PIN Status - Only show in FLEXIBLE mode */}
                            {group.settings?.surpriseMode !== 'mutual' && (
                              <div className="mt-2 flex items-center gap-2">
                                {participantHasJoined ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 border border-green-300 rounded text-xs font-semibold text-green-700">
                                    ✅ Angemeldet
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs font-semibold text-red-700">
                                    ⏳ Ausstehend
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-start gap-2">
                            {/* Gift Status - Different displays for FLEXIBLE vs MUTUAL mode */}
                            <div className="text-right">
                              {group.settings?.surpriseMode === 'mutual' ? (
                                // In MUTUAL mode: Check if participant has actually joined
                                participantHasJoined ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-2xl">🎊</span>
                                    <p className="font-bold text-purple-600 text-sm">Überrascht</p>
                                    <p className="text-xs text-gray-500">Angemeldet</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <span className="text-2xl">⏳</span>
                                    <p className="font-bold text-orange-600 text-sm">Ausstehend</p>
                                    <p className="text-xs text-gray-500">Noch nicht angemeldet</p>
                                  </div>
                                )
                              ) : (
                                // In FLEXIBLE mode: Show gift/surprise status
                                <>
                                  {status.hasGifts ? (
                                    <div className="flex flex-col items-center">
                                      <span className="text-2xl">{status.wantsSurprise ? '🎉' : '✅'}</span>
                                      <p className={`font-bold text-sm ${status.wantsSurprise ? 'text-purple-600' : 'text-green-600'}`}>
                                        {status.wantsSurprise ? 'Überraschung!' : `${status.giftCount} Geschenke`}
                                      </p>
                                      <p className="text-xs text-gray-500">Fertig</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center">
                                      <span className="text-2xl">⏳</span>
                                      <p className="font-bold text-orange-600 text-sm">Ausstehend</p>
                                      <p className="text-xs text-gray-500">Keine Liste</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Action buttons - Show both reset and delete options */}
                            {!group.drawn && (
                              <div className="flex gap-2">
                                {/* Reset button - Undo participant selection (works in all modes) */}
                                <button
                                  onClick={() => handleResetMutualSurpriseSelection(participant.id, participant.name)}
                                  disabled={deletingParticipantId === participant.id}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded transition disabled:opacity-50"
                                  title="Auswahl zurücksetzen - Teilnehmer kann sich neu anmelden"
                                >
                                  {deletingParticipantId === participant.id ? '🔄' : '↩️'}
                                </button>

                                {/* Delete button - Permanently remove participant */}
                                <button
                                  onClick={() => handleDeleteParticipant(participant.id, participant.name)}
                                  disabled={deletingParticipantId === participant.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition disabled:opacity-50"
                                  title="Teilnehmer vollständig löschen"
                                >
                                  {deletingParticipantId === participant.id ? '🔄' : '🗑️'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-6">Keine Teilnehmer</p>
              )}

              {/* Legend as Accordion */}
              <div className="mt-6 border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 transition flex items-center justify-between text-left"
                >
                  <p className="text-sm font-semibold text-gray-900">📖 Legende</p>
                  <span className="text-lg transition" style={{ transform: showLegend ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {showLegend && (
                  <div className="p-4 bg-gray-50 space-y-3 text-sm text-gray-700 border-t border-gray-300">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">✅</span>
                      <div>
                        <p className="font-medium">X Geschenke</p>
                        <p className="text-gray-600">Dieser Teilnehmer hat eine normale Wunschliste mit Geschenkideen angelegt.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🎉</span>
                      <div>
                        <p className="font-medium">Überraschung!</p>
                        <p className="text-gray-600">Dieser Teilnehmer möchte sich überraschen lassen und hat bewusst keine Liste angelegt.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🔐</span>
                      <div>
                        <p className="font-medium">PIN Status</p>
                        <p className="text-gray-600">Grün = PIN wurde gesetzt. Rot = Teilnehmer hat noch keine PIN erstellt.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recovery PIN Section - as Accordion */}
              <div className="mt-6 border-2 border-red-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowRecoveryPin(!showRecoveryPin)}
                  className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 transition flex items-center justify-between text-left"
                >
                  <p className="text-sm font-semibold text-red-900">🆘 Recovery PIN für vergessene Teilnehmer-PINs</p>
                  <span className="text-lg transition" style={{ transform: showRecoveryPin ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {showRecoveryPin && (
                  <div className="p-4 bg-red-50 border-t-2 border-red-300 space-y-4">
                    <p className="text-sm text-red-800">
                      Wenn ein Teilnehmer seinen PIN vergessen hat, kannst du ihm diese universale Recovery-PIN geben. Damit kann er sich anmelden und danach einen neuen PIN setzen.
                    </p>

                    <div className="bg-white rounded-lg p-4 border-2 border-red-200">
                      <p className="text-xs text-gray-600 mb-2">Recovery PIN:</p>
                      <p className="text-3xl font-bold text-red-600 text-center tracking-widest mb-4 font-mono">
                        {RECOVERY_PIN}
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(RECOVERY_PIN);
                          setCopiedRecoveryPin(true);
                          setTimeout(() => setCopiedRecoveryPin(false), 2000);
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
                      >
                        {copiedRecoveryPin ? '✅ Kopiert!' : '📋 Kopieren'}
                      </button>
                    </div>

                    <p className="text-xs text-red-800 bg-red-100 rounded p-3 border border-red-200">
                      💡 <strong>Hinweis:</strong> Teile diese PIN nur an den betreffenden Teilnehmer per privater Nachricht. Nach der Anmeldung sollte er sich sofort einen eigenen PIN setzen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pairings Share Section (after draw) - MOVED TO TOP */}
        {group.drawn && group.settings?.pairingVisibility === 'public' && (
          <div className="card bg-gradient-to-br from-pink-50 to-red-50 border-2 border-red-300 shadow-lg mb-6">
            <h3 className="section-title text-red-900 mb-4">🎁 Link mit den Wichtel-Paarungen teilen</h3>

            <p className="text-sm text-gray-700 mb-4">
              {stats.isMutualMode ? (
                <>
                  Teile diesen Link mit allen Teilnehmern, um die Paarungen anzuschauen. Die Seite zeigt wer wen beschenkt, ohne dass eine PIN erforderlich ist.
                </>
              ) : (
                <>
                  Teile diesen Link mit allen Teilnehmern. Sie sehen dort eine Liste mit allen Namen und wer wen beschenkt. Wenn ein Teilnehmer eine Wunschliste hat, können sie diese mit ihrer PIN sehen. <strong>Wichtig: Jeder Teilnehmer benötigt seine PIN, um auf private Wunschlisten zuzugreifen!</strong>
                </>
              )}
            </p>

            <div className="bg-white rounded border border-red-300 p-4 mb-4 whitespace-pre-wrap font-mono text-xs text-gray-800">
              {pairingsShareText}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pairingsShareText);
                  setCopiedType('pairings');
                  setTimeout(() => setCopiedType(null), 2000);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
              >
                {copiedType === 'pairings' ? '✅ Text kopiert!' : '📋 Text kopieren'}
              </button>

              <div className="relative group">
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold transition">
                  📲 Teilen
                </button>
                <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 right-0 md:left-0 mt-2 w-48 z-10 flex-col gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(pairingsShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 block"
                  >
                    💬 WhatsApp
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(pairingsShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-400 block text-xs"
                  >
                    💬 WhatsApp (App)
                  </a>
                  <a
                    href={`https://signal.me/#p/${encodeURIComponent(pairingsShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 block"
                  >
                    🔒 Signal
                  </a>
                  <a
                    href={`mailto:?body=${encodeURIComponent(pairingsShareText)}`}
                    className="hover:text-blue-400 block"
                  >
                    📧 Email
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pairingsShareText);
                      setCopiedType('pairingShare');
                      setTimeout(() => setCopiedType(null), 2000);
                    }}
                    className="text-left hover:text-yellow-400 block"
                  >
                    {copiedType === 'pairingShare' ? '✅ Kopiert!' : '📌 Kopieren'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-100 border border-red-300 rounded text-xs text-red-900">
              <strong>💡 Hinweis:</strong> Teilnehmer sehen eine Liste mit allen Namen. Sie klicken auf ihren eigenen Namen, um ihren Wichtelpartner und dessen Wunschliste zu sehen. <strong>PIN-Schutz:</strong> Jeder TN braucht seine PIN. Falls jemand seine PIN vergessen hat → Recovery-PIN vom Organizer nutzen!
            </div>
          </div>
        )}

        {/* Invitation Text Template Section */}
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg mb-6">
          <h3 className="section-title text-green-900 mb-4">📝 Einladungstext mit Link</h3>

          <p className="text-sm text-gray-700 mb-4">
            Kopiere diesen Text - der Link ist bereits enthalten! Du kannst ihn noch anpassen, wenn du möchtest:
          </p>

          <div className="bg-white rounded border border-green-300 p-4 mb-4 whitespace-pre-wrap font-mono text-xs text-gray-800 max-h-48 overflow-y-auto">
            {getInvitationText(getParticipantLink(), group)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(getInvitationText(getParticipantLink(), group));
                setCopiedType('invitation');
                setTimeout(() => setCopiedType(null), 2000);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
            >
              {copiedType === 'invitation' ? '✅ Text kopiert!' : '📋 Text kopieren'}
            </button>

            <div className="relative group">
              <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold transition">
                📲 Teilen
              </button>
              <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 right-0 md:left-0 mt-2 w-48 z-10 flex-col gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getInvitationText(getParticipantLink(), group))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 block"
                >
                  💬 WhatsApp
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getInvitationText(getParticipantLink(), group))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 block text-xs"
                >
                  💬 WhatsApp (App)
                </a>
                <a
                  href={`https://signal.me/#p/${encodeURIComponent(getInvitationText(getParticipantLink(), group))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 block"
                >
                  🔒 Signal
                </a>
                <a
                  href={`https://threema.id`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 block"
                  title="Kopiere den Text manuell in Threema"
                >
                  🔐 Threema
                </a>
                <a
                  href={`mailto:?body=${encodeURIComponent(getInvitationText(getParticipantLink(), group))}`}
                  className="hover:text-blue-400 block"
                >
                  📧 Email
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getInvitationText(getParticipantLink(), group));
                    setCopiedType('share');
                    setTimeout(() => setCopiedType(null), 2000);
                  }}
                  className="text-left hover:text-yellow-400 block"
                >
                  {copiedType === 'share' ? '✅ Kopiert!' : '📌 Kopieren'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-100 border border-green-300 rounded text-xs text-green-900">
            <strong>💡 Hinweis:</strong> Teile diesen Text per WhatsApp, Signal, Threema, Email oder andere Messenger, um deine Teilnehmer einzuladen!
          </div>
        </div>

        {/* Organizer Pairings View (Accordion with Spoiler Warning) - ACCORDION VERSION */}
        {group.drawn && (
          <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-400 mb-6">
            {/* Spoiler Warning - ALWAYS VISIBLE */}
            <div className="bg-red-100 border-l-4 border-red-500 p-4 border-b-2 border-orange-300">
              <p className="text-red-900 font-bold mb-2">⚠️ Achtung: Spoiler-Warnung für Organisator!</p>
              <p className="text-red-800 text-sm">
                Wenn du die Überraschung selbst erleben möchtest und nicht wissen willst, wer wen beschenkt, scrolle hier <strong>nicht runter</strong>! Nutze diese Funktion nur, wenn du die Zuordnungen tatsächlich sehen musst (z.B. zur Fehlersuche).
              </p>
            </div>

            <button
              onClick={() => setShowPairingsAccordion(!showPairingsAccordion)}
              className="w-full text-left p-4 hover:bg-orange-100 transition flex items-center justify-between"
            >
              <h3 className="section-title mb-0">👥 Alle Paarungen anschauen (Organizer-Ansicht)</h3>
              <span className="text-2xl transition" style={{ transform: showPairingsAccordion ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </button>

            {showPairingsAccordion && (
              <>
                <div className="border-t border-orange-300">

                  <p className="text-gray-700 px-4 pt-2">
                    Hier kannst du eine Zusammenfassung aller Wichtelpaarungen anschauen:
                  </p>

                  <div className="space-y-3 p-4">
                    {group.pairing && Object.entries(group.pairing).map(([giverId, receiverId]) => {
                      const giver = group.participants.find(p => p.id === giverId);
                      const receiver = group.participants.find(p => p.id === receiverId);
                      const receiverWantsSurprise = !gifts[receiverId] || gifts[receiverId].length === 0;

                      return (
                        <div key={giverId} className="bg-white p-4 rounded-lg border-l-4 border-blue-400 hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 font-bold">{giver?.name || 'Unbekannt'} 🎁</p>
                              <p className="text-gray-600 text-sm">↓</p>
                              <p className="text-gray-900 font-bold">{receiver?.name || 'Unbekannt'} {receiverWantsSurprise ? '🎉 (Überraschung!)' : '📋'}</p>
                            </div>
                            {receiverWantsSurprise && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                Überraschung
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 border-t border-orange-300">
                    <Link href={`/${id}/pairings`} className="block text-center p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
                      🔗 Zur Paarungsliste
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 shadow-lg">
          <div className={`grid gap-4 ${getOrganizerParticipant() ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* Quick Access to Organizer's Own Gift List */}
            {getOrganizerParticipant() && (
              <div className="relative group">
                <Link href={`${getParticipantLink()}?orgParticipant=${getOrganizerParticipant().id}`} className="block text-center p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition shadow-lg">
                  🎁 Meine Wunschliste
                </Link>
                <div className="absolute hidden group-hover:flex bg-gray-900 text-white text-xs rounded-lg p-3 left-0 mt-2 w-56 z-10 flex-col gap-1">
                  <p className="font-semibold">Du nimmst auch teil!</p>
                  <p>Klick hier, um deine eigene Wunschliste zu erstellen.</p>
                </div>
              </div>
            )}

            <Link href={getParticipantLink()} className="block text-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
              🔗 Zum Beitritts-Link
            </Link>

            {!group.drawn && (
              <>
                {stats.percentage === 100 ? (
                  <Link href={`/organizer/${id}/draw`} className="block text-center p-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
                    🎲 Jetzt auslosen
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center p-4 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed opacity-60"
                    title={`${100 - stats.percentage}% der Teilnehmer müssen noch ${stats.isMutualMode ? 'sich anmelden' : 'ihre Listen vervollständigen'}`}
                  >
                    🎲 Auslosen (warte auf {100 - Math.round(stats.percentage)}%)
                  </button>
                )}
              </>
            )}

            <Link href="/" className="block text-center p-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition">
              🏠 Zur Startseite
            </Link>
          </div>

          {!group.drawn && stats.percentage < 100 && (
            <p className="text-center text-sm text-gray-700 mt-4">
              ℹ️ {Math.round(stats.percentage)}% abgeschlossen. Das Auslosen ist möglich, wenn {stats.isMutualMode ? 'alle Teilnehmer sich angemeldet haben' : 'alle Teilnehmer ihre Geschenkelisten eingegeben haben'}.
            </p>
          )}
        </div>

        {/* Organisations-Link Card - Bottom */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 shadow-lg mt-12 mb-12">
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

        {/* Amazon Affiliate Section - Smart Filters for Gift Shopping */}
        {group.drawn && (
          <div className="card">
            <h3 className="section-title mb-4">🛍️ Jetzt shoppen & Geschenke kaufen</h3>
            <p className="text-gray-700 mb-6">
              Die Auslosung ist abgeschlossen! Nutze unsere intelligenten Filter, um die perfekten Geschenke zu finden:
            </p>
            <AmazonFilterSelector />
          </div>
        )}
      </div>
    </div>
  );
}
