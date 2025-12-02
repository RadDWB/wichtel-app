import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { OCCASIONS } from '../../../lib/occasions';
import { getGroup, saveGroup } from '../../../lib/kv-client';
import PinInput from '../../../components/PinInput';
import SwitchAccountDialog from '../../../components/SwitchAccountDialog';
import { APP_VERSION } from '../../../lib/constants';

export const getServerSideProps = async () => {
  return { props: {} };
};

// Generate unique session token (UUID v4 style)
function generateSessionToken() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export default function JoinGroupMutual() {
  const router = useRouter();
  const { groupId, orgParticipant } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Join | pin-create | pin-verify | confirm | 4: Complete
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [nameEdit, setNameEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [participantPin, setParticipantPin] = useState('');
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [tempPin, setTempPin] = useState('');
  const [pinVerificationError, setPinVerificationError] = useState('');
  const stepRef = useRef(step);
  const [organizerPin, setOrganizerPin] = useState('');
  const [sessionCreating, setSessionCreating] = useState(false);
  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingParticipant, setPendingParticipant] = useState(null);

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
          sessionToken,
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

      // Generate unique session token on first visit
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
    const interval = setInterval(() => {
      if (stepRef.current === 4 && !group?.drawn) {
        loadGroup();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [groupId, orgParticipant]);

  // Clear localStorage participant ID when flow is complete (Step 4)
  useEffect(() => {
    if (step === 4 && groupId) {
      localStorage.removeItem(`participant_${groupId}`);
    }
  }, [step, groupId]);

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
        // Verify this is mutual mode
        if (groupData.settings?.surpriseMode !== 'mutual') {
          console.warn('⚠️ This page is for mutual mode only. Redirecting...');
          router.push(`/join/${groupId}`);
          return;
        }

        setGroup(groupData);

        // Only auto-navigate on initial load (not on step 2 - gift entry)
        if (stepRef.current === 1) {
          // Auto-select organizer if coming from organizer dashboard
          if (orgParticipant) {
            const orgParticipantObj = groupData.participants.find(p => p.id === orgParticipant);
            if (orgParticipantObj) {
              setSelectedParticipant(orgParticipantObj);
              setNameEdit(orgParticipantObj.name);
              setEmailEdit(orgParticipantObj.email || '');
              if (groupData.drawn) {
                setStep(1);
              } else {
                setStep('pin-create');
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
              if (groupData.drawn) {
                setStep(1);
              } else {
                setStep('pin-create');
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
    const currentParticipantId = localStorage.getItem(`participant_${groupId}`);

    if (currentParticipantId && currentParticipantId !== participant.id) {
      const sessionToken = localStorage.getItem(`session_token_${groupId}`);

      if (sessionToken && group) {
        const currentParticipant = group.participants?.find(p => p.id === currentParticipantId);
        if (currentParticipant) {
          setPendingParticipant(participant);
          setShowSwitchDialog(true);
          return;
        }
      }
    }

    // Perform the actual join
    performJoin(participant);
  };

  const clearSession = () => {
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
    clearSession();
    setShowSwitchDialog(false);
    performJoin(newParticipant);
  };

  const performJoin = (participant) => {
    // Store participant ID first
    localStorage.setItem(`participant_${groupId}`, participant.id);

    // Store session token with participant for validation
    const sessionToken = localStorage.getItem(`session_token_${groupId}`);
    localStorage.setItem(`participant_session_${groupId}_${participant.id}`, sessionToken);

    // Check if this participant has a stored PIN
    const newKey = `participant_pin_${groupId}_${participant.id}`;
    const legacyKey = `participant_pin_${participant.id}`;
    const legacyPin = localStorage.getItem(legacyKey);
    const storedPin = localStorage.getItem(newKey) || legacyPin;
    if (!localStorage.getItem(newKey) && legacyPin) {
      localStorage.setItem(newKey, legacyPin);
    }

    // Set participant data
    setSelectedParticipant(participant);
    setNameEdit(participant.name);
    setEmailEdit(participant.email || '');
    setParticipantPin(storedPin || '');
    setTempPin('');
    setPinVerificationError('');

    // PIN logic: Required if pairings are PRIVATE (for security)
    // In Public + Mutual mode: No PIN needed (pairings visible to everyone anyway)
    const isPublicPairings = group?.settings?.pairingVisibility === 'public';
    const pinNotNeeded = isPublicPairings;

    if (pinNotNeeded) {
      // Public pairings: No PIN required, go straight to confirmation
      setPinConfirmed(true);
      setStep('confirm');
    } else if (storedPin) {
      // Private pairings + PIN exists → Verify it
      setPinConfirmed(false);
      setStep('pin-verify');
    } else {
      // Private pairings + No PIN → Create one NOW!
      setPinConfirmed(false);
      setStep('pin-create');
    }
  };

  const handleConfirmJoin = async (skipStepChange = false) => {
    if (!nameEdit.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }

    // PIN logic: Required if pairings are PRIVATE (for security)
    // In Public + Mutual mode: PIN is optional (pairings visible to everyone anyway)
    const isPublicPairings = group?.settings?.pairingVisibility === 'public';
    const existingPin = group.participants.find(p => p.id === selectedParticipant.id)?.pin;
    const pinToSave = participantPin || existingPin;

    if (!isPublicPairings && !pinToSave) {
      setError('PIN ist erforderlich. Bitte setze eine PIN.');
      return;
    }

    const updated = {
      ...group,
      participants: group.participants.map(p =>
        p.id === selectedParticipant.id
          ? { ...p, name: nameEdit, email: emailEdit || null, pin: pinToSave }
          : p
      ),
    };

    try {
      await saveGroup(groupId, updated);
      console.log('✅ Group updated in KV');
      setGroup(updated);
      setSelectedParticipant({ ...selectedParticipant, name: nameEdit, email: emailEdit });
      if (!skipStepChange) {
        setStep('confirm');
      }
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

  // Render Switch Account Dialog if needed
  if (showSwitchDialog && pendingParticipant && group) {
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
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 opacity-50 pointer-events-none">
          <div className="container mx-auto py-12 px-4 max-w-2xl">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
              <h1 className="text-4xl font-bold mb-2">🎊 Gegenseitige Überraschung</h1>
              <p className="text-lg">{group?.name}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const occasion = OCCASIONS.find(o => o.id === group.occasion);

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

  // Step 1: Select Participant (MUTUAL MODE)
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
                    const currentParticipantId = localStorage.getItem(`participant_${groupId}`);
                    return p.id !== currentParticipantId;
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

  // Step 1.5: Add New Participant
  if (step === 1.5 && !selectedParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-6">Schön, dass du dabei bist! 🎉</h2>

            <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded mb-6">
              <p className="text-sm text-purple-800">
                <strong>🎊 Gegenseitige Überraschung:</strong> Es gibt keine Wunschlisten.
                Alle werden überrascht! Nach deiner Bestätigung wartet ihr zusammen auf die Auslosung.
              </p>
            </div>

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
                  label="🔐 PIN zum Schutz (erforderlich)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Setze eine PIN, um deine Daten zu schützen.
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
                  if (!participantPin.trim()) {
                    setError('PIN ist erforderlich');
                    return;
                  }
                  const newParticipant = {
                    id: Date.now().toString(),
                    name: nameEdit,
                    email: emailEdit || null,
                    pin: participantPin,
                  };
                  const updated = {
                    ...group,
                    participants: [...group.participants, newParticipant],
                  };

                  try {
                    await saveGroup(groupId, updated);
                    console.log('✅ New participant added to KV');
                    localStorage.setItem(`participant_${groupId}`, newParticipant.id);
                    localStorage.setItem(`participant_pin_${groupId}_${newParticipant.id}`, participantPin);
                    setGroup(updated);
                    setSelectedParticipant(newParticipant);
                    setPinConfirmed(true);
                    setStep('confirm');
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

  // Step 'pin-create': Create PIN immediately after clicking name
  if (step === 'pin-create' && selectedParticipant) {
    const pinError = tempPin && (tempPin.length < 4 || tempPin.length > 6 || !/^\d+$/.test(tempPin));

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-3xl font-bold mb-2">🔐 PIN erstellen</h2>
            <p className="text-gray-600 mb-6">
              Hallo {selectedParticipant.name}! Erstelle eine PIN zum Schutz deiner Daten.
            </p>

            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-900 mb-3 font-semibold">
                🎊 Gegenseitige Überraschung
              </p>
              <ul className="text-sm text-purple-800 space-y-2 ml-4">
                <li>✅ <strong>Keine Wunschlisten:</strong> Alle werden überrascht!</li>
                <li>✅ <strong>PIN-Schutz:</strong> Nur du kannst deine Daten bearbeiten</li>
                <li>✅ <strong>Einfach:</strong> 4-6 Ziffern, die du dir gut merken kannst</li>
                <li>✅ <strong>Nach Auslosung:</strong> Du siehst wen du beschenken musst</li>
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
                  if (!tempPin.trim()) {
                    setError('❌ PIN ist erforderlich. Bitte setze eine PIN.');
                    return;
                  }
                  if (tempPin.length < 4 || tempPin.length > 6 || !/^\d+$/.test(tempPin)) {
                    setError('❌ PIN muss aus 4-6 Ziffern bestehen (nur Zahlen!)');
                    return;
                  }

                  localStorage.setItem(`participant_pin_${groupId}_${selectedParticipant.id}`, tempPin);
                  setParticipantPin(tempPin);
                  setPinConfirmed(true);
                  setTempPin('');
                  createParticipantSession(tempPin);
                  console.log('✅ PIN saved and confirmed');

                  if (!group.drawn) {
                    setStep('confirm');
                  }
                }}
                className="flex-1 btn-primary"
              >
                ✅ PIN bestätigen
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 'pin-verify': Verify PIN
  if (step === 'pin-verify' && selectedParticipant && !pinConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-2">🔐 PIN erforderlich</h2>
            <p className="text-lg text-gray-900 mb-2 font-semibold">{selectedParticipant.name}</p>
            <p className="text-gray-700 mb-6">
              Deine Daten sind mit einer PIN geschützt. Gib deine PIN ein, um fortzufahren.
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
                    setPinVerificationError('');
                  }}
                  placeholder="Gib deine PIN ein"
                  maxLength="6"
                  autoFocus={true}
                  className="input-field w-full"
                  label="PIN"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (tempPin === participantPin) {
                        setPinConfirmed(true);
                        setTempPin('');
                        createParticipantSession(tempPin);
                        if (!group.drawn) {
                          setStep('confirm');
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
                  if (tempPin === participantPin) {
                    setPinConfirmed(true);
                    setTempPin('');
                    setPinVerificationError('');
                    createParticipantSession(tempPin);
                    if (!group.drawn) {
                      setStep('confirm');
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

  // Step 'confirm': Final confirmation (MUTUAL MODE SPECIFIC)
  if (step === 'confirm' && selectedParticipant && pinConfirmed && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎊</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Gegenseitige Überraschung!</h1>
              <p className="text-xl text-gray-700 mb-4">{selectedParticipant.name}</p>
            </div>

            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-8">
              <p className="text-lg font-bold text-purple-900 mb-4">✨ So funktioniert es:</p>
              <ul className="text-gray-700 space-y-3 ml-4">
                <li>✅ <strong>Keine Wunschlisten:</strong> Alle werden überrascht!</li>
                <li>✅ <strong>Deine Paarung:</strong> Nach der Auslosung siehst du, wen du beschenken musst</li>
                <li>✅ <strong>Budget:</strong> {group.budget}</li>
                <li>✅ <strong>Deadline:</strong> Bis {new Date(group.endDate).toLocaleDateString('de-DE')}</li>
                <li>🎁 <strong>Amazon-Filter:</strong> Hilfreiche Filter für Geschenkideen nach der Auslosung</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  await handleConfirmJoin(true);
                  setStep(4);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                ✅ Ja, ich bin dabei!
              </button>

              <button
                onClick={() => {
                  setSelectedParticipant(null);
                  setParticipantPin('');
                  setPinConfirmed(false);
                  setStep(1);
                }}
                className="w-full py-2 px-4 text-blue-600 hover:underline text-sm"
              >
                ← Zurück zur Teilnehmerliste
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Waiting for Draw
  if (step === 4 && selectedParticipant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md text-center">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fast geht's los!</h2>
            <p className="text-xl text-gray-700 mb-6">
              {selectedParticipant.name}, die Auslosung findet statt, wenn alle bereit sind. 🎁
            </p>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
              <p className="text-lg font-bold text-blue-900 mb-4">📋 Was passiert jetzt?</p>
              <ul className="text-gray-700 space-y-2 text-left ml-4">
                <li>✅ Der Organisator führt die Auslosung durch</li>
                <li>✅ Du erhältst die Information, wen du beschenken musst</li>
                <li>✅ Mit unseren Amazon-Filtern findest du das perfekte Geschenk</li>
                <li>✅ Alle Teilnehmende erhalten eine Benachrichtigung</li>
              </ul>
            </div>

            <button
              onClick={() => window.close()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
            >
              ✅ Fertig - ich kann den Tab schließen
            </button>

            <div className="mt-12 text-center text-sm text-gray-600">
              <p>Wichtel v{APP_VERSION}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
