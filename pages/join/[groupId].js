import { useRouter } from 'next/router';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { OCCASIONS } from '../../lib/occasions';
import { getGroup, saveGroup } from '../../lib/kv-client';
import GiftList from '../../components/GiftList';
import AmazonFilterSelector from '../../components/AmazonFilterSelector';
import { APP_VERSION } from '../../lib/constants';

export const getServerSideProps = async () => {
  return { props: {} };
};

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
  const [step, setStep] = useState(1); // 1: Join | 1.5: GiftChoice | 2: Gifts | 3: Exclusions | 4: Complete
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [nameEdit, setNameEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [exclusions, setExclusions] = useState({});
  const [wantsSurprise, setWantsSurprise] = useState(false); // Ich möchte überrascht werden
  const [participantPin, setParticipantPin] = useState(''); // Optional PIN for participant protection
  const [pinConfirmed, setPinConfirmed] = useState(false); // Track if PIN step is done
  const [tempPin, setTempPin] = useState(''); // Temporary PIN during Step 4.5 setup
  const [pinVerificationError, setPinVerificationError] = useState(''); // Error message for PIN verification
  const stepRef = useRef(step); // Track step without causing effect re-runs
  const [showNoGiftsDialog, setShowNoGiftsDialog] = useState(false);
  const [currentGifts, setCurrentGifts] = useState([]); // Store gifts for current participant during step 2
  const [organizerPin, setOrganizerPin] = useState(''); // Store organizer PIN to redirect back correctly

  // Update ref when step changes
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (groupId) {
      loadGroup();

      // Load organizer PIN from localStorage if available
      if (orgParticipant) {
        const savedPin = localStorage.getItem(`organizer_pin_${groupId}`);
        if (savedPin) {
          setOrganizerPin(savedPin);
        }
      }
    }

    // Refresh group status every 15 seconds (reduced from 5s for mobile performance)
    // BUT: Only poll on steps 1, 3, 4 - NOT on step 2 (gift entry) to avoid form disruption
    const interval = setInterval(() => {
      // Check ref to see if we should poll (don't block on step change)
      if (stepRef.current !== 2 && stepRef.current !== 1.5) {
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
              setStep(1.5); // Go to gift choice
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
              setStep(1.5); // Go to gift choice
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
    setSelectedParticipant(participant);
    setNameEdit(participant.name);
    setEmailEdit(participant.email || '');
    setParticipantPin(''); // Reset PIN field for new participant
    setTempPin(''); // Reset temp PIN
    setPinVerificationError(''); // Clear any previous errors
    localStorage.setItem(`participant_${groupId}`, participant.id);

    // Load PIN if it exists in localStorage
    const storedPin = localStorage.getItem(`participant_pin_${groupId}_${participant.id}`);
    if (storedPin) {
      // PIN exists - show verification screen
      setParticipantPin(storedPin); // Store the correct PIN
      setPinConfirmed(false); // Not confirmed yet
      setStep(1.5); // Go to PIN verification screen
    } else {
      // No PIN set - skip to gift choice
      setParticipantPin('');
      setPinConfirmed(true); // Already "verified" since no PIN
      setStep(1.5); // Go to gift choice
    }
  };

  const handleConfirmJoin = async () => {
    if (!nameEdit.trim()) {
      setError('Bitte gib deinen Namen ein');
      return;
    }

    const updated = {
      ...group,
      participants: group.participants.map(p =>
        p.id === selectedParticipant.id
          ? { ...p, name: nameEdit, email: emailEdit || null }
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

  const occasion = OCCASIONS.find(o => o.id === group.occasion);

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

            <div className="space-y-3 mb-8">
              {group.participants && group.participants.length > 0 ? (
                group.participants.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleJoin(p)}
                    className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left font-semibold text-gray-900"
                  >
                    {p.name}
                  </button>
                ))
              ) : (
                <p className="text-gray-600">Noch keine Teilnehmer</p>
              )}
            </div>

            <button
              onClick={() => setStep(1.5)}
              className="w-full btn-outline text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              + Ich bin nicht in der Liste - neu hinzufügen
            </button>
          </div>

          {/* Amazon Shopping Filter - Inspiration Section on Welcome Page */}
          <div className="mb-8">
            <p className="text-gray-700 mb-4 font-semibold">💡 Brauchst du Inspirationen zum Einkaufen?</p>
            <AmazonFilterSelector />
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
                <label className="block text-sm font-medium mb-2">PIN zum Schutz (optional)</label>
                <input
                  type="password"
                  value={participantPin}
                  onChange={(e) => setParticipantPin(e.target.value)}
                  placeholder="z.B. 1234"
                  className="input-field w-full"
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
            <h2 className="text-2xl font-bold mb-6">🔐 PIN erforderlich</h2>
            <p className="text-gray-700 mb-6">
              Du hast eine PIN für den Schutz deiner Daten gesetzt. Bitte gib deine PIN ein, um fortzufahren.
            </p>

            {pinVerificationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {pinVerificationError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">PIN</label>
                <input
                  type="password"
                  value={tempPin}
                  onChange={(e) => {
                    setTempPin(e.target.value);
                    setPinVerificationError(''); // Clear error when typing
                  }}
                  placeholder="Gib deine PIN ein"
                  className="input-field w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Verify on Enter key
                      if (tempPin === participantPin) {
                        setPinConfirmed(true);
                        setTempPin('');
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
                <label className="block text-sm font-medium mb-2">PIN zum Schutz (optional)</label>
                <input
                  type="password"
                  value={participantPin}
                  onChange={(e) => setParticipantPin(e.target.value)}
                  placeholder="z.B. 1234"
                  className="input-field w-full"
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

  // Step 1.5: Gift Choice (Wunschliste oder überrascht werden)
  if (step === 1.5 && selectedParticipant && pinConfirmed && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">🎁 Was möchtest du?</h1>
            <p className="text-gray-600 text-lg">
              Entscheide dich: Möchtest du eine Wunschliste erstellen oder dich überraschen lassen?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Option 1: Wunschliste erstellen */}
            <button
              onClick={() => {
                setWantsSurprise(false);
                setStep(2);
              }}
              className="block p-8 border-2 border-blue-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition bg-white shadow-md"
            >
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Wunschliste erstellen</h2>
              <p className="text-gray-700 text-left">
                Ich möchte meine eigene Liste erstellen und genau angeben, was ich mir wünsche.
              </p>
              <div className="mt-6 text-sm text-gray-600 text-left space-y-2">
                <p>✅ Bis zu 10 Artikel</p>
                <p>✅ Mit Amazon-Links</p>
                <p>✅ Mit Kategorien</p>
              </div>
            </button>

            {/* Option 2: Überrascht werden */}
            <button
              onClick={() => {
                setWantsSurprise(true);
                setStep(3); // Skip to exclusions directly
              }}
              className="block p-8 border-2 border-purple-300 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition bg-white shadow-md"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Überrascht werden</h2>
              <p className="text-gray-700 text-left">
                Ich möchte mich überraschen lassen und keine Wunschliste angeben.
              </p>
              <div className="mt-6 text-sm text-gray-600 text-left space-y-2">
                <p>✨ Keine Liste nötig</p>
                <p>✨ Spannung bewahren</p>
                <p>✨ Überraschungs-Spaß</p>
              </div>
            </button>
          </div>

          <div className="text-center">
            <button
              onClick={() => setStep(1)}
              className="text-red-600 hover:underline text-sm"
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

          <div className="max-w-2xl mx-auto mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h2 className="font-bold text-blue-900 mb-2">📋 Schritt 1: Geschenkeliste erstellen</h2>
            <p className="text-sm text-blue-800">
              {currentGifts.length > 0
                ? `Du hast bereits ${currentGifts.length} Geschenk${currentGifts.length !== 1 ? 'e' : ''} auf deiner Liste. Du kannst diese bearbeiten, löschen oder weitere hinzufügen.`
                : 'Erstelle deine Geschenkeliste. Sobald ALLE Teilnehmer ihre Listen fertig haben, wird der Organisator die Auslosung starten.'}
            </p>
          </div>

          <GiftList
            group={group}
            groupId={groupId}
            participantId={selectedParticipant.id}
          />

          {/* Amazon Filters Help Section */}
          <div className="max-w-2xl mx-auto mt-8 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">💡 Geschenk-Inspirationen auf Amazon</h3>
            <p className="text-gray-700 mb-6">
              Du möchtest noch mehr Geschenkideen? Nutze unsere intelligenten Filter, um auf Amazon.de zu stöbern:
            </p>
            <AmazonFilterSelector preselectedPrice={getBudgetPriceRange(group?.budget)} />
          </div>
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
                ✅ Fertig - zu Ausschlüssen →
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

          <div className="max-w-2xl mx-auto mb-6 bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h2 className="font-bold text-purple-900 mb-2">📋 Schritt 2 (optional): Wichtelpartner ausschließen</h2>
            <p className="text-sm text-purple-800">
              Wenn du möchtest, kannst du jetzt einen Teilnehmer ausschließen, dem/der du kein Geschenk kaufen möchtest. Zum Beispiel deinen Partner, Familienmitglieder oder sehr enge Freunde. Das ist aber völlig optional – du kannst diesen Schritt auch einfach überspringen!
            </p>
          </div>

          <h1 className="text-3xl font-bold mb-6">🚫 Wen möchtest du ausschließen?</h1>

          {group.participants && group.participants.length >= 2 && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="text-sm text-gray-700 mb-2">
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
                  setStep(4);
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

  // Step 4.5: Set PIN after completing list
  if (step === 4.5 && selectedParticipant && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-3xl font-bold mb-6">🔐 PIN zum Schutz setzen</h2>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
              <p className="text-sm text-green-800 mb-2">
                <strong>💡 Warum eine PIN?</strong>
              </p>
              <p className="text-sm text-green-700">
                Mit einer PIN schützt du deine Wunschliste vor ungewollten Änderungen auf diesem Gerät. Nur jemand mit der PIN kann deine Daten bearbeiten.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">PIN (4-6 Ziffern)</label>
                <input
                  type="password"
                  value={tempPin}
                  onChange={(e) => setTempPin(e.target.value)}
                  placeholder="z.B. 1234"
                  className="input-field w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Leer lassen um die PIN zu überspringen
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(4);
                }}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
              <button
                onClick={() => {
                  // Save PIN if provided
                  if (tempPin.trim()) {
                    localStorage.setItem(`participant_pin_${groupId}_${selectedParticipant.id}`, tempPin);
                    setParticipantPin(tempPin);
                    console.log('✅ PIN saved after list completion');
                  }
                  setStep(4);
                }}
                className="flex-1 btn-primary"
              >
                ✅ Speichern & Fertig
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
              Du bist angemeldet und alles wurde gespeichert. Jetzt geht's los! 🚀
            </p>

            {/* PIN Security Warning if not set */}
            {!participantPin && (
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-900 mb-3">
                  <strong>⚠️ Achtung:</strong> Ohne PIN kann jeder auf diesem Gerät deine Daten bearbeiten.
                </p>
                <button
                  onClick={() => {
                    setStep(4.5); // Go to PIN setup step
                  }}
                  className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-semibold"
                >
                  🔐 PIN jetzt setzen
                </button>
              </div>
            )}

            {/* Big Button to Create Wishlist */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-3">📝 Deine Wunschliste</h2>
              <p className="text-gray-700 mb-6">
                Jetzt trag deine Geschenkwünsche ein! Schreib auf, was du dir wünschst, damit dein Wichtel weiß, was dich glücklich macht. 🎁
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-lg text-lg transition transform hover:scale-105"
              >
                ✨ Wunschliste jetzt erstellen
              </button>
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
                  participantId={partnerId}
                  isViewing={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
