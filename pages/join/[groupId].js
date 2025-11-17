import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { OCCASIONS } from '../../lib/occasions';
import { getGroup, saveGroup, saveExclusions } from '../../lib/kv-client';
import GiftList from '../../components/GiftList';

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
  const stepRef = useRef(step); // Track step without causing effect re-runs

  // Update ref when step changes
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }

    // Refresh group status every 5 seconds to detect when it's marked as complete
    // BUT: Only poll on steps 1, 3, 4 - NOT on step 2 (gift entry) to avoid form disruption
    const interval = setInterval(() => {
      // Check ref to see if we should poll (don't block on step change)
      if (stepRef.current !== 2) {
        loadGroup();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [groupId, orgParticipant]);

  // Clear localStorage participant ID when flow is complete (Step 4)
  // So user starts fresh on next visit with participant list
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
    setStep(1.5); // Go to gift choice first
    localStorage.setItem(`participant_${groupId}`, participant.id);
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

          <div className="bg-white rounded-lg p-8 shadow-md">
            <h2 className="text-2xl font-bold mb-6">Hallo! 👋</h2>
            <p className="text-gray-600 mb-6">
              Klicke auf deinen Namen, um teilzunehmen. Wenn dein Name nicht in der Liste ist, kannst du auch neu hinzugefügt werden.
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
                    setGroup(updated);
                    setSelectedParticipant(newParticipant);
                    setStep(1.5); // Go to gift choice, not directly to exclusions
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

  // Step 1.5: Gift Choice (Wunschliste oder überrascht werden)
  if (step === 1.5 && selectedParticipant && !group.drawn) {
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
                Ich möchte mich überraschen lassen und keineWunschliste angeben.
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
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <a href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück
          </a>

          <div className="max-w-2xl mx-auto mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 rounded-lg p-6 shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎁 {selectedParticipant.name}s Wunschliste</h1>
            <p className="text-sm text-gray-600">
              Das ist deine persönliche Seite. Hier trägst du deine Geschenkwünsche ein.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h2 className="font-bold text-blue-900 mb-2">📋 Phase 1: Geschenkeliste erstellen</h2>
            <p className="text-sm text-blue-800">
              Erstelle deine Geschenkeliste. Sobald ALLE Teilnehmer ihre Listen fertig haben, wird der Organisator die Auslosung starten.
            </p>
          </div>

          <GiftList
            group={group}
            groupId={groupId}
            participantId={selectedParticipant.id}
          />
          <div className="container mx-auto mt-8 max-w-2xl">
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 btn-outline"
              >
                ← Zurück zur Teilnehmerliste
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-primary"
              >
                ✅ Fertig - zu Ausschlüssen →
              </button>
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
          <div className="max-w-2xl mx-auto mb-6 bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h2 className="font-bold text-purple-900 mb-2">🎁 Phase 2: Persönliche Ausschlüsse (optional)</h2>
            <p className="text-sm text-purple-800">
              Definiere jetzt, wem du NICHT ein Geschenk kaufen möchtest. Z.B. dein Partner, enge Familie, etc. Dies wird berücksichtigt bei der Auslosung.
            </p>
          </div>

          <h1 className="text-3xl font-bold mb-6">🚫 Wen möchtest du ausschließen?</h1>

          {group.participants && group.participants.length >= 2 && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <p className="text-gray-700 mb-4">
                Wähle eine Person aus, der/dem du definitiv NICHT ein Geschenk kaufen möchtest (optional):
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
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700">
                  ✅ Du hast folgende Person ausgeschlossen: <strong>{group.participants.find(p => p.id === Object.keys(exclusions).filter(k => exclusions[k])[0])?.name}</strong>
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

  // Step 4: Waiting for draw
  if (step === 4 && selectedParticipant && !group.drawn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <div className="bg-white rounded-lg p-8 shadow-lg mb-6">
            <h1 className="text-4xl font-bold mb-4">✅ Du bist angemeldet!</h1>
            <p className="text-lg text-gray-700 mb-8">
              Großartig! Deine Ausschlüsse wurden gespeichert.
            </p>

            {/* Big Button to Create Wishlist */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-3">📝 Erstelle deine Wunschliste</h2>
              <p className="text-gray-700 mb-6">
                Jetzt ist es an der Zeit, deine Geschenkwünsche einzutragen! So weiß dein Wichtel, was du dir wünschst.
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-lg text-lg transition transform hover:scale-105"
              >
                ✨ Meine Wunschliste erstellen
              </button>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
              <p className="text-sm text-gray-600">
                <strong>Das passiert dann:</strong>
              </p>
              <ol className="text-sm text-gray-600 mt-2 space-y-1 text-left">
                <li>📝 Du trägst deine Geschenkwünsche ein (1-10 Produkte)</li>
                <li>✅ Du wartest, bis alle anderen Teilnehmer auch fertig sind</li>
                <li>⏳ Der Organisator startet die Auslosung</li>
                <li>🎁 Du erfährst dann, wen du beschenken darfst</li>
                <li>🛍️ Du siehst die Geschenkeliste deines Partners und kannst einkaufen!</li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
              <p className="text-sm text-gray-700">
                💡 <strong>Tipp:</strong> Der Organisator wird euch Bescheid geben, sobald alle fertig sind. Dann beginnt die Auslosung!
              </p>
            </div>

            <a href="/" className="btn-outline text-center block">
              ← Zur Startseite
            </a>
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

    // Check if partner has a gift list (gifts will be loaded by GiftList component)
    // If no gifts and partner wanted surprise, show surprise message
    const [partnerGifts, setPartnerGifts] = useState([]);

    useEffect(() => {
      const loadPartnerGifts = async () => {
        try {
          const response = await fetch(`/api/gifts/${groupId}?participantId=${partnerId}`);
          const data = await response.json();
          setPartnerGifts(data.gifts || []);
        } catch (err) {
          console.error('Error loading partner gifts:', err);
        }
      };
      if (partnerId && group.drawn) {
        loadPartnerGifts();
      }
    }, [partnerId, group.drawn, groupId]);

    const partnerWantsSurprise = partnerGifts && partnerGifts.length === 0;

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
              // Partner wants surprise - show special message
              <div className="bg-white rounded-lg p-8 shadow-md text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">Überraschungs-Zeit!</h2>
                <p className="text-lg text-gray-700 mb-6">
                  {partner.name} möchte sich überraschen lassen! 🎊
                </p>
                <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                  Diese Person hat bewusst keine Wunschliste angelegt und vertraut darauf, dass du das Richtige für sie auswählst. Das macht es zu einer echten Überraschung!
                </p>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-700 font-semibold mb-3">
                    💡 Tipps für die Überraschung:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
                    <li>✨ Budget beachten: {group.budget}</li>
                    <li>✨ Persönliche Interessen berücksichtigen</li>
                    <li>✨ Kreativ und liebevoll auswählen</li>
                    <li>✨ Die Überraschung ist das Geschenk!</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">
                  Viel Spaß beim Einkaufen! 🛍️
                </p>
              </div>
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
