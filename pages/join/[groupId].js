import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { OCCASIONS } from '../../lib/occasions';
import { getGroup, saveGroup } from '../../lib/kv-client';
import GiftList from '../../components/GiftList';
import AmazonFilterSelector from '../../components/AmazonFilterSelector';
import PinInput from '../../components/PinInput';
import SwitchAccountDialog from '../../components/SwitchAccountDialog';
import { APP_VERSION } from '../../lib/constants';

export const getServerSideProps = async () => {
  return { props: {} };
};

// Note: RECOVERY_PIN is only available in organizer dashboard, not in join flow
// This ensures only the actual participant can access their account

// Generate unique session token (UUID v4 style)
function generateSessionToken() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

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

export default function JoinGroup() {
  const router = useRouter();
  const { groupId, orgParticipant } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Join | pin-create | pin-verify | 1.5: GiftChoice | 2: Gifts | 3: Exclusions | confirm | 4: Complete
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [nameEdit, setNameEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [exclusions, setExclusions] = useState({});
  const [wantsSurprise, setWantsSurprise] = useState(false); // Ich möchte überrascht werden
  const [participantPin, setParticipantPin] = useState(''); // Optional PIN for participant protection
  const [pinConfirmed, setPinConfirmed] = useState(false); // Track if PIN step is done
  const [tempPin, setTempPin] = useState(''); // Temporary PIN during PIN creation/verification
  const [pinVerificationError, setPinVerificationError] = useState(''); // Error message for PIN verification
  const stepRef = useRef(step); // Track step without causing effect re-runs
  const [showNoGiftsDialog, setShowNoGiftsDialog] = useState(false);
  const [currentGifts, setCurrentGifts] = useState([]); // Store gifts for current participant during step 2
  const [organizerPin, setOrganizerPin] = useState(''); // Store organizer PIN to redirect back correctly
  const [sessionCreating, setSessionCreating] = useState(false);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false); // Show account switch confirmation dialog
  const [pendingParticipant, setPendingParticipant] = useState(null); // Participant waiting to be selected
  const [showMutualSurpriseWarning, setShowMutualSurpriseWarning] = useState(false); // Show mutual surprise warning

  // Update ref when step changes
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const createParticipantSession = async (pinValue) => {
    if (!groupId || !selectedParticipant?.id || !pinValue) return;
    try {
      setSessionCreating(true);
      const sessionToken = localStorage.getItem(`session_token_${groupId}`);
      const resp = await fetch('/api/session/participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          participantId: selectedParticipant.id,
          pin: pinValue,
          sessionToken, // Send session token for validation
        }),
      });
      if (!resp.ok) {
        console.warn('Session creation failed', await resp.text());
      }
    } catch (err) {
      console.error('Error creating participant session:', err);
    } finally {
      setSessionCreating(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroup();

      // Generate unique session token on first visit to this link
      const existingSessionToken = localStorage.getItem(`session_token_${groupId}`);
      if (!existingSessionToken) {
        const sessionToken = generateSessionToken();
        localStorage.setItem(`session_token_${groupId}`, sessionToken);
        console.log('✅ New session token created:', sessionToken);
      }

      // Load organizer PIN from localStorage if available
      if (orgParticipant) {
        const savedPin = localStorage.getItem(`organizer_pin_${groupId}`);
        if (savedPin) {
          setOrganizerPin(savedPin);
        }
      }
    }

    // Refresh group status every 15 seconds but ONLY when waiting for draw (Step 4)
    // This prevents unnecessary reloads and page blinking on other steps
    const interval = setInterval(() => {
      // Only poll if waiting for draw (Step 4) and draw hasn't happened yet
      if (stepRef.current === 4 && !group?.drawn) {
        loadGroup();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [groupId, orgParticipant]);

  // Clear localStorage participant ID when flow is complete (Step 4)
  // So user starts fresh on next visit with participant list
  useEffect(() => {
    if (step === 4 && groupId) {
      localStorage.removeItem(`participant_${groupId}`);
    }
  }, [step, groupId]);

  // Load current gifts when entering step 2
  useEffect(() => {
    const loadCurrentGifts = async () => {
      if (step !== 2 || !selectedParticipant || !groupId) return;

      try {
        const response = await fetch(`/api/gifts/${groupId}?participantId=${selectedParticipant.id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentGifts(data.gifts || []);
        }
      } catch (err) {
        console.error('Error loading gifts for step 2:', err);
        setCurrentGifts([]);
      }
    };

    loadCurrentGifts();
  }, [step, selectedParticipant, groupId]);

  // Wenn Schritt 3 erreicht wird und noch keine Geschenke gespeichert sind,
  // zeigen wir einen Hinweis-Dialog (Überraschung oder Wunschliste später).
  useEffect(() => {
    const checkGiftsForDialog = async () => {
      if (step !== 3 || !selectedParticipant || !groupId || wantsSurprise) return;

      try {
        const response = await fetch(`/api/gifts/${groupId}?participantId=${selectedParticipant.id}`);
        if (!response.ok) return;

        const data = await response.json();
        const gifts = data.gifts || [];

        if (gifts.length === 0) {
          setShowNoGiftsDialog(true);
        } else {
          setShowNoGiftsDialog(false);
        }
      } catch (err) {
        console.error('Error checking gifts for no-gifts dialog:', err);
      }
    };

    checkGiftsForDialog();
  }, [step, selectedParticipant, groupId, wantsSurprise]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      let groupData = null;

      // Try KV first (primary storage)
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

        // Only auto-navigate on initial load (not on step 2 - gift entry)
        // This prevents disrupting the user while they're adding gifts
        if (stepRef.current === 1 || stepRef.current === 1.5) {
          // Auto-select organizer if coming from organizer dashboard
          if (orgParticipant) {
            const orgParticipantObj = groupData.participants.find(p => p.id === orgParticipant);
            if (orgParticipantObj) {
              setSelectedParticipant(orgParticipantObj);
              setNameEdit(orgParticipantObj.name);
              setEmailEdit(orgParticipantObj.email || '');
              // After draw: show name list (Step 1)
              // Before draw: go to gift choice (Step 1.5)
              if (groupData.drawn) {
                setStep(1); // Show participant list after draw
              } else {
                setStep(1.5); // Go to gift choice before draw
              }
              localStorage.setItem(`participant_${groupId}`, orgParticipant);
              return;
            }
          }

          // Check if participant is already joined
          const participantId = localStorage.getItem(`participant_${groupId}`);
          if (participantId) {
            const participant = groupData.participants.find(p => p.id === participantId);
            if (participant) {
              setSelectedParticipant(participant);
              // After draw: show name list (Step 1)
              // Before draw: go to gift choice (Step 1.5)
              if (groupData.drawn) {
                setStep(1); // Show participant list after draw
              } else {
                setStep(1.5); // Go to gift choice before draw
              }
            }
          }
        }
      } else {
        setError('❌ Gruppe nicht gefunden. Bitte überprüfe den Link.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Fehler beim Laden der Gruppe');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (participant) => {
    // Check if someone is already logged in and they're clicking a different name
    const currentParticipantId = localStorage.getItem(`participant_${groupId}`);

    // Multi-participant detection:
    // Check if user is switching to a different participant
    // Use currentParticipantId (from localStorage) instead of selectedParticipant (React state)
    // because selectedParticipant can be null after page reload while localStorage persists
    if (currentParticipantId && currentParticipantId !== participant.id) {
      const sessionToken = localStorage.getItem(`session_token_${groupId}`);

      // If we have a session token, find the current participant from the group data
      // and show the switch dialog (new behavior)
      if (sessionToken && group) {
        const currentParticipant = group.participants?.find(p => p.id === currentParticipantId);
        if (currentParticipant) {
          setPendingParticipant(participant);
          setShowSwitchDialog(true);
          return;
        }
      }
      // If no session token (legacy), just allow switching silently (backwards compatible)
    }

    // Check if this is mutual surprise mode AND first time joining
    // Show warning about irreversible participant selection
    if (group.settings?.surpriseMode === 'mutual' && !currentParticipantId) {
      setPendingParticipant(participant);
      setShowMutualSurpriseWarning(true);
      return;
    }

    // Perform the actual join
    performJoin(participant);
  };

  const clearSession = () => {
    // Clear all session and participant data
    if (selectedParticipant) {
      localStorage.removeItem(`participant_${groupId}`);
      localStorage.removeItem(`participant_pin_${groupId}_${selectedParticipant.id}`);
      localStorage.removeItem(`participant_session_${groupId}_${selectedParticipant.id}`);
    }
    setSelectedParticipant(null);
    setParticipantPin('');
    setTempPin('');
    setPinConfirmed(false);
    setPinVerificationError('');
    setStep(1);
  };

  const handleSwitchAccount = (newParticipant) => {
    // Clear current session and login as new participant
    clearSession();
    setShowSwitchDialog(false);
    performJoin(newParticipant);
  };

  const performJoin = (participant) => {
    // Store participant ID first (before checking anything)
    localStorage.setItem(`participant_${groupId}`, participant.id);

    // Store session token with participant for validation
    const sessionToken = localStorage.getItem(`session_token_${groupId}`);
    localStorage.setItem(`participant_session_${groupId}_${participant.id}`, sessionToken);

    // Check if this participant has a stored PIN using participant.id
    const newKey = `participant_pin_${groupId}_${participant.id}`;
    const legacyKey = `participant_pin_${participant.id}`;
    const legacyPin = localStorage.getItem(legacyKey);
    const storedPin = localStorage.getItem(newKey) || legacyPin;
    if (!localStorage.getItem(newKey) && legacyPin) {
      localStorage.setItem(newKey, legacyPin); // migrate once so future logins work
    }

    // Set participant data
    setSelectedParticipant(participant);
    setNameEdit(participant.name);
    setEmailEdit(participant.email || '');
    setParticipantPin(storedPin || ''); // Store PIN if it exists
    setTempPin(''); // Reset PIN input
    setPinVerificationError(''); // Clear any previous errors

    // PIN logic: Required if (A) has wish list (flexible mode) OR (B) pairings are private
    // Only skip PIN in Mutual + Public mode (no wish lists AND pairings visible to everyone)
    const isMutualMode = group?.settings?.surpriseMode === 'mutual';
    const isPublicPairings = group?.settings?.pairingVisibility === 'public';
    const pinNotNeeded = isMutualMode && isPublicPairings;

    if (pinNotNeeded) {
      // Mutual + Public: skip PIN steps entirely, go directly to gift choice (or confirmation)
      setPinConfirmed(true);
      setStep(1.5);
    } else {
      // PIN is needed: either has wish list (flexible) or private pairings
      if (storedPin) {
        // PIN exists → Verify it
        setPinConfirmed(false);
        setStep('pin-verify');
      } else {
        // No PIN → Create one NOW!
        setPinConfirmed(false);
        setStep('pin-create');
      }
    }
  };

  const handleConfirmJoin = async () => {
    if (!nameEdit.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }

    // Ensure PIN is set: In Mutual+Public mode, assign a placeholder PIN if none exists
    const isMutualMode = group?.settings?.surpriseMode === 'mutual';
    const isPublicPairings = group?.settings?.pairingVisibility === 'public';
    const existingPin = group.participants.find(p => p.id === selectedParticipant.id)?.pin;
    const pinToSave = participantPin || existingPin || (isMutualMode && isPublicPairings ? '000000' : null);

    const updated = {
      ...group,
      participants: group.participants.map(p =>
        p.id === selectedParticipant.id
          ? { ...p, name: nameEdit, email: emailEdit || null, pin: pinToSave }
          : p
      ),
    };

    try {
      // Save to KV (primary - no fallback)
      await saveGroup(groupId, updated);
      console.log('✅ Group updated in KV');
      setGroup(updated);
      setSelectedParticipant({ ...selectedParticipant, name: nameEdit, email: emailEdit });
      setStep(1.5); // Go to gift choice first
    } catch (kvErr) {
      console.error('❌ Failed to save group:', kvErr);
      setError('Fehler beim Speichern. Bitte versuche es später erneut.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm(`⚠️ ${selectedParticipant?.name} wirklich aus der Gruppe austragen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/participants/${selectedParticipant.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Austragen');
      }

      // Clear localStorage and reset
      localStorage.removeItem(`participant_${groupId}`);
      setSelectedParticipant(null);
      setStep(1);
      await loadGroup();
    } catch (err) {
      console.error('Error leaving group:', err);
      setError(`❌ Fehler: ${err.message}`);
    }
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-4">❌ Gruppe nicht gefunden</p>
          <a href="/" className="text-red-600 hover:underline">
            ← Zurück zur Startseite
          </a>
        </div>
      </div>
    );
  }

  // Render dialogs BEFORE step checks so they appear on top
  // Mutual Surprise Warning Dialog
  if (showMutualSurpriseWarning && pendingParticipant) {
    const isPublicPairings = group?.settings?.pairingVisibility === 'public';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
          <div className="p-6">
            {/* Icon */}
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">🎊</div>
              <h2 className="text-2xl font-bold text-gray-900">Gegenseitige Überraschung!</h2>
            </div>

            {/* Message */}
            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 mb-6 rounded">
              <p className="text-sm text-gray-700 mb-3">
                Dieses Wichteln findet so statt, dass <strong>jeder überrascht wird</strong> und {isPublicPairings ? 'die Paarungen öffentlich nach der Auslosung einsehbar sind' : 'nur jeder seine eigene Paarung sehen kann'}.
              </p>
              <p className="text-sm text-gray-700">
                {isPublicPairings
                  ? '🎁 Es gibt keine geheimen Wunschlisten - alle Wichtelpaare werden nach dem Zug verraten.'
                  : '🎁 Es gibt keine geheimen Wunschlisten - nur deine eigene Paarung bleibt privat.'}
              </p>
            </div>

            {/* Important Info */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded">
              <p className="text-xs text-orange-900 mb-2 font-semibold">
                ⚠️ <strong>Wichtig:</strong>
              </p>
              <p className="text-xs text-orange-800 mb-2">
                Deine Wahl ist <strong>endgültig</strong>. Du kannst dich nach der Bestätigung nicht mehr als andere Person anmelden oder deine Auswahl ändern.
              </p>
              <p className="text-xs text-orange-800">
                Nur der Organisator kann diese Wahl bei Bedarf rückgängig machen.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMutualSurpriseWarning(false);
                  setPendingParticipant(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
              >
                ← Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowMutualSurpriseWarning(false);
                  performJoin(pendingParticipant);
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                ✅ Ja, ich bin {pendingParticipant.name}!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Switch Account Dialog if needed
  if (showSwitchDialog && pendingParticipant && group) {
    // Get current participant name from group data using stored ID
    // This handles the case where selectedParticipant state is null after reload
    const currentParticipantId = localStorage.getItem(`participant_${groupId}`);
    const currentParticipantFromGroup = group.participants?.find(p => p.id === currentParticipantId);
    const currentName = currentParticipantFromGroup?.name || selectedParticipant?.name || 'Unbekannter Benutzer';

    return (
      <>
        <SwitchAccountDialog
          currentParticipantName={currentName}
          newParticipantName={pendingParticipant.name}
          onConfirm={() => handleSwitchAccount(pendingParticipant)}
          onCancel={() => {
            setShowSwitchDialog(false);
            setPendingParticipant(null);
          }}
        />
        {/* Keep the Step 1 view in background */}
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 opacity-50 pointer-events-none">
          <div className="container mx-auto py-12 px-4 max-w-2xl">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
              <h1 className="text-4xl font-bold mb-2">{occasion?.label}</h1>
              <p className="text-lg">{group?.name}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const occasion = OCCASIONS.find(o => o.id === group.occasion);

  // Color palette for participant names
  const PARTICIPANT_COLORS = [
    { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
    { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700' },
    { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700' },
    { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700' },
    { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700' },
    { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700' },
    { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700' },
    { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700' },
    { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700' },
    { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700' },
  ];

  const getParticipantColor = (index) => {
    return PARTICIPANT_COLORS[index % PARTICIPANT_COLORS.length];
  };

  // Step 1: Select Participant
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">{occasion?.label}</h1>
            <p className="text-lg">{group.name}</p>
            <p className="text-sm mt-2 opacity-90">Organisiert von: {group.organizerName}</p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-2">Willkommen! 👋</h2>
            <p className="text-gray-600 mb-6">
              Klicke auf deinen Namen, um teilzunehmen. Wenn dein Name nicht in der Liste ist, kannst du dich auch neu hinzufügen.
            </p>

            <div className="space-y-4 mb-8">
              {group.participants && group.participants.length > 0 ? (
                group.participants
                  .filter(p => {
                    // In mutual surprise mode: hide already-joined participants (those that completed the flow)
                    // A participant is "joined" if they've already set up their PIN in this session
                    if (group.settings?.surpriseMode === 'mutual') {
                      // Check if this participant has already joined in this session
                      const currentParticipantId = localStorage.getItem(`participant_${groupId}`);
                      // Show all participants except the one currently logged in
                      return p.id !== currentParticipantId;
                    }
                    return true;
                  })
                  .map((p, index) => {
                    const color = getParticipantColor(index);
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleJoin(p)}
                        className={`w-full p-6 border-3 ${color.border} rounded-lg hover:shadow-lg hover:scale-105 transition transform ${color.bg} ${color.text}`}
                      >
                        <p className="text-2xl font-bold text-center">{p.name}</p>
                      </button>
                    );
                  })
              ) : (
                <p className="text-gray-600">Noch keine Teilnehmer</p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep(1.5)}
                className="w-full btn-outline text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                + Ich bin nicht in der Liste - neu hinzufügen
              </button>
              <button
                onClick={() => window.location.href = `/organizer/${groupId}`}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                👨‍💼 Ich bin der Organisator - zum Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW: Step 'pin-create' - Create PIN immediately after clicking name (BEFORE everything else!)
  if (step === 'pin-create' && selectedParticipant) {
    const pinError = tempPin && (tempPin.length < 4 || tempPin.length > 6 || !/^\d+$/.test(tempPin));
    const isMutualMode = group?.settings?.surpriseMode === 'mutual';
    const isPrivatePairings = group?.settings?.pairingVisibility === 'private';

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-3xl font-bold mb-2">🔐 PIN erstellen</h2>
            <p className="text-gray-600 mb-6">
              Hallo {selectedParticipant.name}! Erstelle eine PIN, um {
                isMutualMode
                  ? 'zu sehen wem du etwas schenken musst'
                  : 'deine Wunschliste zu schützen'
              }.
            </p>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900 mb-3 font-semibold">
                🔐 Wofür brauchst du die PIN?
              </p>
              <ul className="text-sm text-blue-800 space-y-2 ml-4">
                {!isMutualMode && (
                  <li>✅ <strong>Schutz:</strong> Nur du kannst deine Wunschliste sehen und bearbeiten</li>
                )}
                {isPrivatePairings && (
                  <li>✅ <strong>Nach Auslosung:</strong> Du brauchst die PIN, um zu sehen wem du etwas schenken musst</li>
                )}
                {!isPrivatePairings && (
                  <li>✅ <strong>Nach Auslosung:</strong> Die Paarungen sind öffentlich, aber mit PIN bestätigst du deine Identität</li>
                )}
                <li>✅ <strong>Einfach:</strong> 4-6 Ziffern, die du dir gut merken kannst</li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <PinInput
                  value={tempPin}
                  onChange={(e) => {
                    setTempPin(e.target.value);
                    setError('');
                  }}
                  placeholder="z.B. 123456"
                  maxLength="6"
                  autoFocus={true}
                  className={`input-field w-full ${pinError ? 'border-red-500' : ''}`}
                  label="📝 Deine PIN (4-6 Ziffern)"
                />
                {pinError && (
                  <p className="text-xs text-red-600 mt-2">
                    ❌ PIN muss aus 4-6 Ziffern bestehen (nur Zahlen!)
                  </p>
                )}
                {tempPin && !pinError && (
                  <p className="text-xs text-green-600 mt-2">
                    ✅ PIN ist gültig
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedParticipant(null);
                  setTempPin('');
                  setError('');
                }}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
              <button
                onClick={() => {
                  // Validate PIN
                  if (!tempPin.trim()) {
                    setError('❌ PIN ist erforderlich. Bitte setze eine PIN.');
                    return;
                  }
                  if (tempPin.length < 4 || tempPin.length > 6 || !/^\d+$/.test(tempPin)) {
                    setError('❌ PIN muss aus 4-6 Ziffern bestehen (nur Zahlen!)');
                    return;
                  }

                  // Save PIN
                  localStorage.setItem(`participant_pin_${groupId}_${selectedParticipant.id}`, tempPin);
                  setParticipantPin(tempPin);
                  setPinConfirmed(true);
                  setTempPin('');
                  createParticipantSession(tempPin);
                  console.log('✅ PIN saved and confirmed');

                  // After Draw: Don't change step - post-draw view will render automatically
                  // Before Draw: Go to gift choice menu
                  if (!group.drawn) {
                    setStep(1.5); // VOR Draw: Gift Choice
                  }
                  // POST Draw: Keep current step, post-draw view renders automatically
                }}
                disabled={!tempPin || tempPin.length < 4 || tempPin.length > 6 || !/^\d+$/.test(tempPin)}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✅ PIN speichern & Weiter
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW: Step 'pin-verify' - Verify PIN (when PIN exists)
  if (step === 'pin-verify' && selectedParticipant && participantPin && !pinConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold">🔐 PIN eingeben</h2>
              <span className="text-xs text-gray-400 font-mono">v{APP_VERSION}</span>
            </div>
            <p className="text-gray-600 mb-6">
              Willkommen zurück, {selectedParticipant.name}! Gib deine PIN ein, um fortzufahren.
            </p>

            {pinVerificationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {pinVerificationError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <PinInput
                  value={tempPin}
                  onChange={(e) => {
                    setTempPin(e.target.value);
                    setPinVerificationError(''); // Clear error when typing
                  }}
                  placeholder="Gib deine PIN ein"
                  maxLength="6"
                  autoFocus={true}
                  className="input-field w-full"
                  label="PIN"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Verify on Enter key
                      if (tempPin === participantPin) {
                        setPinConfirmed(true);
                        setTempPin('');
                        createParticipantSession(tempPin);
                        // Before Draw: go weiter zum Gift-Choice
                        if (!group.drawn) {
                          setStep(1.5);
                        }
                      } else {
                        setPinVerificationError('❌ PIN ist falsch. Bitte versuche es erneut.');
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-sm text-blue-900">
                🔑 <strong>PIN vergessen?</strong><br/>
                Bitte kontaktiere den Organisator für Hilfe
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedParticipant(null);
                  setParticipantPin('');
                  setTempPin('');
                  setPinConfirmed(false);
                  setPinVerificationError('');
                  setStep(1);
                }}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
              <button
                onClick={() => {
                  if (tempPin === participantPin || tempPin === RECOVERY_PIN) {
                    setPinConfirmed(true);
                    setTempPin('');
                    setPinVerificationError('');
                    createParticipantSession(tempPin);
                    if (!group.drawn) {
                      setStep(1.5);
                    }
                  } else {
                    setPinVerificationError('❌ PIN ist falsch. Bitte versuche es erneut.');
                  }
                }}
                className="flex-1 btn-primary"
              >
                ✅ Bestätigen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1.5a: Add New Participant (wenn noch nicht ausgewählt)
  if (step === 1.5 && !selectedParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-6">Schön, dass du dabei bist! 🎉</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Dein Name</label>
                <input
                  type="text"
                  value={nameEdit}
                  onChange={(e) => setNameEdit(e.target.value)}
                  placeholder="z.B. Dein Name"
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">E-Mail (optional)</label>
                <input
                  type="email"
                  value={emailEdit}
                  onChange={(e) => setEmailEdit(e.target.value)}
                  placeholder="z.B. dein@email.com"
                  className="input-field w-full"
                />
              </div>

              <div>
                <PinInput
                  value={participantPin}
                  onChange={(e) => setParticipantPin(e.target.value)}
                  placeholder="z.B. 1234"
                  maxLength="6"
                  className="input-field w-full"
                  label="PIN zum Schutz (optional)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Setze eine PIN, um deine Daten zu schützen. Ohne PIN kann jeder auf diesem Gerät deine Daten bearbeiten.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
              <button
                onClick={async () => {
                  if (!nameEdit.trim()) {
                    setError('Bitte gib deinen Namen ein');
                    return;
                  }
                  const newParticipant = {
                    id: Date.now().toString(),
                    name: nameEdit,
                    email: emailEdit || null,
                    pin: participantPin || null,
                  };
                  const updated = {
                    ...group,
                    participants: [...group.participants, newParticipant],
                  };

                  try {
                    // Save to KV (primary - no fallback)
                    await saveGroup(groupId, updated);
                    console.log('✅ New participant added to KV');
                    localStorage.setItem(`participant_${groupId}`, newParticipant.id);

                    // Save PIN if provided
                    if (participantPin.trim()) {
                      localStorage.setItem(`participant_pin_${groupId}_${newParticipant.id}`, participantPin);
                    }

                    setGroup(updated);
                    setSelectedParticipant(newParticipant);
                    setStep(1.5); // Go to gift choice
                  } catch (kvErr) {
                    console.error('❌ Failed to save new participant:', kvErr);
                    setError('Fehler beim Hinzufügen. Bitte versuche es später erneut.');
                  }
                }}
                className="flex-1 btn-primary"
              >
                ✅ Beitreten
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1.5a1: Verify PIN if participant has one set
  if (step === 1.5 && selectedParticipant && !pinConfirmed && participantPin && !group.drawn) {
    // Participant has a PIN - show verification screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-2">🔐 PIN erforderlich</h2>
            <p className="text-lg text-gray-900 mb-2 font-semibold">{selectedParticipant.name}</p>
            <p className="text-gray-700 mb-6">
              Deine Daten sind mit einer PIN geschützt. Gib deine PIN ein, um deine Informationen zu bearbeiten.
            </p>

            {pinVerificationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {pinVerificationError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <PinInput
                  value={tempPin}
                  onChange={(e) => {
                    setTempPin(e.target.value);
                    setPinVerificationError(''); // Clear error when typing
                  }}
                  placeholder="Gib deine PIN ein"
                  maxLength="6"
                  autoFocus={true}
                  className="input-field w-full"
                  label="PIN"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Verify on Enter key
                      if (tempPin === participantPin) {
                        setPinConfirmed(true);
                        setTempPin('');
                        setWantsSurprise(undefined); // Reset to show gift choice menu
                      } else {
                        setPinVerificationError('❌ PIN ist falsch. Bitte versuche es erneut.');
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedParticipant(null);
                  setParticipantPin('');
                  setTempPin('');
                  setPinConfirmed(false);
                  setPinVerificationError('');
                  setStep(1);
                }}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
              <button
                onClick={() => {
                  if (tempPin === participantPin) {
                    setPinConfirmed(true);
                    setTempPin('');
                    setPinVerificationError('');
                    setWantsSurprise(undefined); // Reset to show gift choice menu
                  } else {
                    setPinVerificationError('❌ PIN ist falsch. Bitte versuche es erneut.');
                  }
                }}
                className="flex-1 btn-primary"
              >
                ✅ Bestätigen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1.5a2: Confirm existing participant & set optional PIN (NEW PARTICIPANTS ONLY)
  if (step === 1.5 && selectedParticipant && !pinConfirmed && !participantPin && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-6">Hallo, {selectedParticipant.name}! 👋</h2>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <p className="text-sm text-blue-800">
                <strong>💡 Optional:</strong> Schütze deine Daten mit einer PIN. So kann nur jemand mit der PIN deine Wunschliste ändern.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <PinInput
                  value={participantPin}
                  onChange={(e) => setParticipantPin(e.target.value)}
                  placeholder="z.B. 1234"
                  maxLength="6"
                  className="input-field w-full"
                  label="PIN zum Schutz (optional)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Leer lassen um die Seite ohne PIN zu nutzen
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedParticipant(null);
                    setParticipantPin('');
                    setPinConfirmed(false);
                    setStep(1);
                  }}
                  className="flex-1 btn-outline"
                >
                  ← Zurück
                </button>
                <button
                  onClick={() => {
                    // Save PIN if provided
                    if (participantPin.trim()) {
                      localStorage.setItem(`participant_pin_${groupId}_${selectedParticipant.id}`, participantPin);
                      console.log('✅ PIN saved for participant');
                    }
                    setPinConfirmed(true); // Move to gift choice
                    setWantsSurprise(undefined); // Reset surprise to show gift choice menu
                  }}
                  className="flex-1 btn-primary"
                >
                  ✅ Weiter zu Wünschen →
                </button>
              </div>

              <button
                onClick={async () => {
                  if (window.confirm(`⚠️ Du wirst aus der Gruppe "${group.name}" entfernt. Diese Aktion kann nicht rückgängig gemacht werden. Sicher?`)) {
                    try {
                      const response = await fetch(`/api/groups/${groupId}/participants/${selectedParticipant.id}`, {
                        method: 'DELETE',
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        alert(`❌ Fehler: ${errorData.error}`);
                      } else {
                        alert('✅ Du wurdest aus der Gruppe entfernt.');
                        localStorage.removeItem(`participant_${groupId}`);
                        setSelectedParticipant(null);
                        setStep(1);
                        await loadGroup(); // Reload group to show updated participant list
                      }
                    } catch (err) {
                      console.error('Error removing participant:', err);
                      alert('❌ Fehler beim Entfernen. Bitte versuche es später erneut.');
                    }
                  }
                }}
                className="w-full btn-outline text-red-600 border-red-300 hover:bg-red-50"
              >
                ❌ Nicht teilnehmen (aus Gruppe entfernen)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 1.5: Gift Choice (Wunschliste oder überrascht werden) - ONLY FOR FLEXIBLE MODE
  // In MUTUAL SURPRISE MODE: skip directly to confirmation
  if (step === 1.5 && selectedParticipant && pinConfirmed && !group.drawn) {
    // In mutual surprise mode, skip gift choice and go to confirmation step
    // Note: wantsSurprise should NOT be set - it's about pairingVisibility, not gift lists
    if (group.settings?.surpriseMode === 'mutual') {
      setStep('confirm'); // Go to explicit confirmation - no gift lists or exclusions in mutual mode
      return null;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🎁 Was möchtest du?</h1>
            <p className="text-gray-600 text-lg">
              Entscheide dich: Möchtest du eine Wunschliste erstellen oder dich überraschen lassen?
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
              {/* Option 1: Wunschliste erstellen */}
              <button
                onClick={() => {
                  setWantsSurprise(false);
                  setStep(2);
                }}
                className="block p-6 border-2 border-blue-400 rounded-lg hover:border-blue-700 hover:bg-blue-50 transition bg-white shadow-md"
              >
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Wunschliste</h3>
                <p className="text-sm text-gray-700 text-left">
                  Ich möchte eine eigene Liste erstellen.
                </p>
              </button>

              {/* OR Divider */}
              <div className="hidden md:flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-400 font-medium">ODER</p>
                </div>
              </div>

              {/* Option 2: Überrascht werden */}
              <button
                onClick={() => {
                  setWantsSurprise(true);
                  setStep(3); // Skip to exclusions directly
                }}
                className="block p-6 border-2 border-purple-400 rounded-lg hover:border-purple-700 hover:bg-purple-50 transition bg-white shadow-md"
              >
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Überrascht werden</h3>
                <p className="text-sm text-gray-700 text-left">
                  Ich möchte mich überraschen lassen.
                </p>
              </button>
            </div>

            {/* Mobile OR Divider */}
            <div className="md:hidden text-center">
              <p className="text-gray-400 font-medium text-sm">ODER</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                // Switch back to step 1 to select a different participant
                clearSession();
              }}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition"
            >
              👤 Als anderer Benutzer anmelden
            </button>
            <button
              onClick={handleLeaveGroup}
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
            >
              ❌ Aus der Gruppe austragen
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2 px-4 text-red-600 hover:underline text-sm"
            >
              ← Zurück zur Teilnehmerliste
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Gifts (add gifts BEFORE group marked complete)
  if (step === 2 && selectedParticipant && !group.drawn && !wantsSurprise) {
    const handleGiftsNext = async () => {
      try {
        const response = await fetch(`/api/gifts/${groupId}?participantId=${selectedParticipant.id}`);
        if (response.ok) {
          const data = await response.json();
          const gifts = data.gifts || [];

          if (gifts.length === 0) {
            setShowNoGiftsDialog(true);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking gifts before continuing:', err);
        // Im Fehlerfall verhalten wir uns wie vorher und gehen weiter
      }

      setStep(3);
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <a href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück
          </a>

          <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 rounded-lg p-6 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎁 {selectedParticipant.name}s Wunschliste</h1>
            <p className="text-sm text-gray-600">
              {currentGifts.length > 0
                ? '✅ Du hast bereits eine Liste erstellt. Du kannst sie hier bearbeiten oder ergänzen.'
                : 'Das ist deine persönliche Seite. Hier trägst du deine Geschenkwünsche ein.'}
            </p>
          </div>

          <GiftList
            group={group}
            groupId={groupId}
            participantId={selectedParticipant.id}
          />

          <div className="container mx-auto mt-8 max-w-2xl">
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => {
                  if (orgParticipant) {
                    const dashboardUrl = organizerPin ? `/organizer/${groupId}?showPin=${organizerPin}` : `/organizer/${groupId}`;
                    router.push(dashboardUrl);
                  } else {
                    setStep(1);
                  }
                }}
                className="flex-1 btn-outline"
              >
                ← {orgParticipant ? 'Zum Dashboard' : 'Zur Teilnehmerliste'}
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-primary"
              >
                ✅ Weiter → Hier kannst du eine Person als Wichtelpartner ausschließen
              </button>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-gray-700">
              <p className="mb-2">
                <strong>💡 Wunschliste später ändern?</strong>
              </p>
              <p className="mb-2">
                Du kannst die Wunschliste jederzeit über denselben Gruppen-Link wieder aufrufen und ergänzen oder ändern.
              </p>
              <p>
                Auf diesem Gerät merkt sich die Seite dich automatisch – auf anderen Geräten öffne einfach wieder denselben Link.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Exclusions (personal preferences - who NOT to buy for)
  if (step === 3 && selectedParticipant && !group.drawn) {
    // This step allows participant to exclude people they don't want to buy for
    // (e.g., their partner, family members)

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          {/* Header with Version */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600">
                🎁 Wichtel Partner
              </h1>
              <span className="inline-block bg-gradient-to-r from-red-600 to-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                v{APP_VERSION}
              </span>
            </div>
          </div>


          <h1 className="text-3xl font-bold mb-6">🚫 Wen möchtest du ausschließen?</h1>

          {group.participants && group.participants.length >= 2 && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>ℹ️ Wie funktioniert das Ausschließen?</strong>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Wenn du jemanden ausschließt, versuchen wir, dass du dieser Person kein Geschenk kaufen musst. Das hilft besonders, wenn es Paare oder Familienmitglieder gibt.
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Wichtig:</strong> Wenn jemand von mehreren Personen ausgeschlossen wird, kann es sein, dass diese Person dir trotzdem zugelost wird. Das ist normal – wir versuchen unser Bestes! 😊
                </p>
              </div>

              <p className="text-gray-700 mb-4 font-semibold">
                Du kannst maximal eine Person ausschließen:
              </p>

              <div className="space-y-3">
                {group.participants
                  .filter(p => p.id !== selectedParticipant?.id)
                  .map((p) => {
                    const hasExclusion = Object.keys(exclusions).some(k => exclusions[k]);
                    const isThisSelected = Object.keys(exclusions).filter(k => exclusions[k])[0] === p.id;
                    const isDisabled = hasExclusion && !isThisSelected;

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3 border border-gray-300 rounded-lg ${
                          isDisabled
                            ? 'opacity-50 cursor-not-allowed bg-gray-100'
                            : 'cursor-pointer hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="exclusion"
                          checked={isThisSelected || false}
                          onChange={(e) => {
                            if (e.target.checked && !hasExclusion) {
                              setExclusions({ [p.id]: true });
                            }
                          }}
                          disabled={isDisabled}
                          className="w-4 h-4"
                        />
                        <span className={`font-medium ${isDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                          {p.name}
                        </span>
                      </label>
                    );
                  })}
              </div>

              {Object.keys(exclusions).some(k => exclusions[k]) && (
                <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded">
                  <p className="text-sm text-gray-700">
                    ✅ <strong>Ausgeschlossen:</strong> Du wirst <strong>{group.participants.find(p => p.id === Object.keys(exclusions).filter(k => exclusions[k])[0])?.name}</strong> nicht beschenken müssen.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={async () => {
                // Save exclusions to KV and group
                const key = `${selectedParticipant?.id}`;
                const updatedExclusions = { ...group.exclusions };
                Object.entries(exclusions).forEach(([toId, isExcluded]) => {
                  if (isExcluded) {
                    updatedExclusions[`${key}-${toId}`] = true;
                  }
                });

                // Mark "surprise me" preference if selected
                const updatedParticipants = group.participants.map(p =>
                  p.id === selectedParticipant.id
                    ? { ...p, wantsSurprise: wantsSurprise }
                    : p
                );

                const updated = { ...group, exclusions: updatedExclusions, participants: updatedParticipants };

                try {
                  // Save to KV (primary - no fallback)
                  await saveGroup(groupId, updated);
                  console.log('✅ Exclusions and surprise preference saved to KV');
                  setGroup(updated);
                  setStep('confirm'); // Go to confirmation step before waiting
                } catch (kvErr) {
                  console.error('❌ Failed to save exclusions:', kvErr);
                  setError('Fehler beim Speichern der Ausschlüsse. Bitte versuche es später erneut.');
                }
              }}
              className="w-full btn-primary"
            >
              ✅ Fertig!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step "confirm": Final confirmation before waiting for draw
  if (step === 'confirm' && selectedParticipant && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-lg mb-6">
            <div className="text-5xl mb-4 text-center">🎉</div>
            <h1 className="text-4xl font-bold mb-4 text-center text-gray-900">Bestätigung erforderlich</h1>
            <p className="text-lg text-gray-700 mb-8 text-center">
              Alles bereit? Bitte bestätige deine Teilnahme.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
              <p className="text-gray-800 font-semibold mb-4">Du meldest dich an als:</p>
              <p className="text-2xl font-bold text-blue-600 mb-2">{selectedParticipant.name}</p>
              {selectedParticipant.email && (
                <p className="text-sm text-gray-600">📧 {selectedParticipant.email}</p>
              )}
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-700 mb-3">
                <strong>✅ Das ist dein finaler Schritt:</strong>
              </p>
              <ul className="text-sm text-gray-700 space-y-2 ml-2">
                <li>🎁 Deine Anmeldung ist verbindlich</li>
                <li>⏳ Warte auf die Auslosung durch den Organisator</li>
                {group?.settings?.surpriseMode === 'mutual' ? (
                  <li>🔐 Du wirst überrascht - keine Wunschliste erforderlich</li>
                ) : (
                  <li>🔐 Verwende deine PIN, um deine Daten und Wunschliste später zu bearbeiten</li>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(3); // Go back to previous step (exclusions in flexible, or back button in mutual)
                }}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
              <button
                onClick={() => {
                  // Move to step 4 (waiting for draw)
                  setStep(4);
                }}
                className="flex-1 btn-primary"
              >
                ✅ Ja, ich bin dabei!
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Waiting for draw
  if (step === 4 && selectedParticipant && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-lg mb-6">
            <div className="text-5xl mb-4 text-center">🎉</div>
            <h1 className="text-4xl font-bold mb-4 text-center text-green-600">Glückwunsch!</h1>
            <p className="text-lg text-gray-700 mb-8 text-center">
              Du bist angemeldet und alles wurde gespeichert. 🎊
            </p>


            {/* Secondary: What Happens Next */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-orange-900 mb-4">❓ Wie geht es nun weiter?</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold text-orange-900">Warten auf Auslosung:</span> Der Organisator wird die Gruppen auslosen und dir dann mitteilen, wen du beschenken darfst.
                </p>
                {group?.settings?.surpriseMode !== 'mutual' && (
                  <>
                    <p>
                      <span className="font-semibold text-orange-900">Nach der Auslosung:</span> Du erhältst einen Link zu deinem Wichtelpartner und kannst mit deiner PIN seine Wunschliste einsehen.
                    </p>
                    <p>
                      <span className="font-semibold text-orange-900">Geschenk besorgen:</span> Nutze die Wunschliste oder unsere Amazon-Filter, um das perfekte Geschenk zu finden! 🎁
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Optional: Edit Wishlist - Secondary Action OR Shopping Link */}
            {group?.settings?.surpriseMode === 'mutual' && group?.settings?.pairingVisibility === 'public' ? (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-700 mb-3">
                  <span className="font-semibold">💡 Hinweis:</span> Du möchtest schon Geschenke kaufen?
                </p>
                <a
                  href="https://www.amazon.de?tag=wichtel-22"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition"
                >
                  🛍️ Zu Amazon
                </a>
              </div>
            ) : group?.settings?.surpriseMode !== 'mutual' ? (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-8">
                <p className="text-sm text-gray-700 mb-3">
                  <span className="font-semibold">Hinweis:</span> Du kannst deine Wunschliste jederzeit bearbeiten, bis die Auslosung stattfindet. Dies ist optional.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg transition"
                >
                  ✏️ Zur Wunschliste
                </button>
              </div>
            ) : null}

            <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 mb-6 text-sm text-gray-700">
              <p className="mb-2">
                <strong>ℹ️ Du kannst diese Seite nun verlassen.</strong>
              </p>
              <p className="text-xs text-gray-600 mb-3">
                💡 <strong>Hinweis:</strong> Die Seite wird in regelmäßigen Abständen neu geladen, um den Status zu überprüfen. Das ist normal und kein Fehler!
              </p>
            </div>

            <div className="flex gap-3">
              {orgParticipant && (
                <Link href={organizerPin ? `/organizer/${groupId}?showPin=${organizerPin}` : `/organizer/${groupId}`} className="flex-1 text-center block p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition">
                  📊 Zum Dashboard
                </Link>
              )}
              <Link href="/" className={`${orgParticipant ? 'flex-1' : 'w-full'} text-center block p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition`}>
                🏠 Zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // After draw: Show partner's gifts or surprise message
  if (group.drawn && selectedParticipant) {
    const partnerId = group.pairing?.[selectedParticipant.id];
    const partner = group.participants.find(p => p.id === partnerId);

    if (!partner) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 mb-4">⏳ Auslosung läuft noch...</p>
            <p className="text-gray-600">Gleich siehst du, wen du beschenken darfst!</p>
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
                    preselectedPrice={getBudgetPriceRange(group?.budget)}
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
                  participantId={partnerId}
                  isViewing={true}
                />
              </div>
            )}

            {/* Optional: Back to Dashboard for Organizer */}
            {orgParticipant && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-3 text-center">
                  Du bist Organisator dieser Gruppe
                </div>
                <Link href={organizerPin ? `/organizer/${groupId}?showPin=${organizerPin}` : `/organizer/${groupId}`} className="block w-full text-center p-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition">
                  📊 Zurück zum Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
