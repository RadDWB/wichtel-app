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

  // Step 3: Exclusions
  if (step === 3 && group.isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
        <div className="container mx-auto py-12 px-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">🚫 Ausschlüsse (optional)</h1>

          {group.participants && group.participants.length >= 3 && (
            <div className="bg-white rounded-lg p-6 shadow-md mb-6">
              <p className="text-gray-700 mb-4">
                Wähle maximal 2 Personen aus, denen du definitiv NICHT ein Geschenk kaufen möchtest (z.B. Partner, Familie).
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
                          if (e.target.checked && currentCount >= 2) {
                            alert('Du kannst maximal 2 Personen ausschließen');
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
    );
  }

  // Step 2: Gifts (visible when isComplete is false, or after joining)
  if ((step === 2 || step === 4) && selectedParticipant && !group.drawn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <a href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück
          </a>
          <GiftList
            group={group}
            groupId={groupId}
            participantId={selectedParticipant.id}
          />
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
