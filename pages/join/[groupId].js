import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { OCCASIONS } from '../../lib/occasions';
import GiftList from '../../components/GiftList';

export default function JoinGroup() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1: Join | 2: Gifts | 3: Exclusions | 4: Complete
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [nameEdit, setNameEdit] = useState('');
  const [emailEdit, setEmailEdit] = useState('');
  const [exclusions, setExclusions] = useState({});

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }

    // Refresh group status every 5 seconds to detect when it's marked as complete
    const interval = setInterval(() => {
      const saved = localStorage.getItem(`group_${groupId}`);
      if (saved) {
        const latest = JSON.parse(saved);
        setGroup(latest);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [groupId]);

  const loadGroup = () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem(`group_${groupId}`);
      if (saved) {
        setGroup(JSON.parse(saved));

        // Check if participant is already joined
        const participantId = localStorage.getItem(`participant_${groupId}`);
        if (participantId) {
          const participant = JSON.parse(saved).participants.find(p => p.id === participantId);
          if (participant) {
            setSelectedParticipant(participant);
            setStep(2);
          }
        }
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
    setStep(2);
    localStorage.setItem(`participant_${groupId}`, participant.id);
  };

  const handleConfirmJoin = () => {
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

    localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
    setGroup(updated);
    setSelectedParticipant({ ...selectedParticipant, name: nameEdit, email: emailEdit });
    setStep(3);
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

  // Step 1.5: Add New Participant
  if (step === 1.5) {
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
                onClick={() => {
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
                  localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
                  localStorage.setItem(`participant_${groupId}`, newParticipant.id);
                  setGroup(updated);
                  setSelectedParticipant(newParticipant);
                  setStep(3);
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

  // Step 2: Gifts (add gifts BEFORE group marked complete)
  if (step === 2 && selectedParticipant && !group.drawn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <a href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück
          </a>

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
            <button
              onClick={() => setStep(3)}
              className="w-full btn-primary"
            >
              ✅ Geschenkeliste fertig - zu Ausschlüssen →
            </button>
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
                Wähle bis zu {Math.max(1, Math.floor(group.participants.length / 2))} Person(en) aus, denen du definitiv NICHT ein Geschenk kaufen möchtest:
              </p>

              <div className="space-y-3">
                {group.participants
                  .filter(p => p.id !== selectedParticipant?.id)
                  .map((p) => (
                    <label key={p.id} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={exclusions[p.id] || false}
                        onChange={(e) => {
                          const currentCount = Object.values(exclusions).filter(v => v).length;
                          const maxExclusions = Math.max(1, Math.floor(group.participants.length / 2));

                          if (e.target.checked && currentCount >= maxExclusions) {
                            alert(`Du kannst maximal ${maxExclusions} Person(en) ausschließen`);
                            return;
                          }
                          setExclusions({
                            ...exclusions,
                            [p.id]: e.target.checked,
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">{p.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                // Save exclusions to group
                const key = `${selectedParticipant?.id}`;
                const updatedExclusions = { ...group.exclusions };
                Object.entries(exclusions).forEach(([toId, isExcluded]) => {
                  if (isExcluded) {
                    updatedExclusions[`${key}-${toId}`] = true;
                  }
                });

                const updated = { ...group, exclusions: updatedExclusions };
                localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
                setGroup(updated);
                setStep(4);
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

  // After draw: Show partner's gifts
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 mb-8 shadow-lg">
              <h1 className="text-4xl font-bold mb-2">🎁 Du wichtelst für:</h1>
              <p className="text-3xl font-bold">{partner.name}</p>
              <p className="text-sm mt-2 opacity-90">Budget: {group.budget}</p>
            </div>

            {/* Partner's Gifts */}
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
          </div>
        </div>
      </div>
    );
  }

  return null;
}
