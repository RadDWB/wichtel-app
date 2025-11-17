import { useState } from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { OCCASIONS, getDefaultName } from '../lib/occasions';

export default function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Occasion
  const [occasion, setOccasion] = useState('');

  // Step 2: Group Info
  const [groupName, setGroupName] = useState('');
  const [endDate, setEndDate] = useState('');

  // Step 3: Organizer Info
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [participatesInGroup, setParticipatesInGroup] = useState(false);

  // Step 4: Participants
  const [participants, setParticipants] = useState([{ name: '', email: '' }]);

  // Step 5: Budget
  const [budget, setBudget] = useState('');

  const handleOccasionSelect = (occasionId) => {
    setOccasion(occasionId);
    setGroupName(getDefaultName(occasionId));
    setStep(2);
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 5) {
        handleCreateGroup();
      } else {
        setStep(step + 1);
      }
    }
  };

  const validateStep = () => {
    setError('');
    switch (step) {
      case 2:
        if (!groupName.trim()) {
          setError('Bitte gib einen Gruppennamen ein');
          return false;
        }
        if (!endDate) {
          setError('Bitte wähle ein Enddatum');
          return false;
        }
        return true;
      case 3:
        if (!organizerName.trim()) {
          setError('Bitte gib deinen Namen ein');
          return false;
        }
        if (!organizerEmail.trim() || !organizerEmail.includes('@')) {
          setError('Bitte gib eine gültige E-Mail-Adresse ein');
          return false;
        }
        return true;
      case 4:
        const validParticipants = participants.filter(p => p.name.trim());
        if (validParticipants.length < 2) {
          setError('Bitte füge mindestens 2 Teilnehmer hinzu');
          return false;
        }
        return true;
      case 5:
        if (!budget.trim()) {
          setError('Bitte gib ein Budget ein');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '' }]);
  };

  const removeParticipant = (index) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const updateParticipant = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleCreateGroup = async () => {
    setLoading(true);
    setError('');

    try {
      const groupId = uuidv4().slice(0, 8);
      // Generate 3-digit PIN
      const organizerPin = String(Math.floor(Math.random() * 900) + 100);

      // Filter empty participants (exclude if organizer already in list)
      const validParticipants = participants
        .filter(p => p.name.trim())
        .filter(p => !(participatesInGroup && p.name.trim() === organizerName.trim())) // Don't add organizer twice
        .map(p => ({
          id: Date.now().toString() + Math.random(),
          name: p.name.trim(),
          email: p.email.trim() || null,
        }));

      // Add organizer as participant if checked
      if (participatesInGroup) {
        validParticipants.unshift({
          id: 'organizer-' + Date.now(),
          name: organizerName,
          email: organizerEmail,
        });
      }

      const group = {
        id: groupId,
        name: groupName,
        occasion,
        budget,
        endDate,
        organizerName,
        organizerEmail,
        organizerId: groupId, // For organizer access control
        organizerPin, // 3-digit PIN for organizer
        participants: validParticipants,
        exclusions: {},
        drawn: false,
        createdAt: new Date().toISOString(),
        isComplete: false,
      };

      // Save to Redis via API (server-side)
      try {
        const response = await fetch('/api/groups/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save group');
        }

        console.log('✅ Group saved to Redis');
      } catch (err) {
        console.error('❌ Save failed:', err);
        setError(`Fehler beim Speichern: ${err.message}`);
        setLoading(false);
        return;
      }

      // Save organizer session auth (localStorage only for session data)
      localStorage.setItem(`organizer_${groupId}`, JSON.stringify({ pin: organizerPin, createdAt: new Date().toISOString() }));

      // Redirect to organizer dashboard with PIN shown
      router.push(`/organizer/${groupId}?showPin=${organizerPin}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Fehler beim Erstellen der Gruppe. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 mx-1 rounded-full ${
                  s <= step ? 'bg-red-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-gray-600">
            Schritt {step} von 5
          </p>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Occasion */}
          {step === 1 && (
            <div>
              <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">
                🎁 Wofür wichtelt ihr?
              </h1>
              <p className="text-center text-gray-600 mb-8">
                Wähle den Anlass für deine Wichtelrunde
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OCCASIONS.map((occ) => (
                  <button
                    key={occ.id}
                    onClick={() => handleOccasionSelect(occ.id)}
                    className="p-6 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-left font-semibold"
                  >
                    {occ.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Group Info */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">📋 Gruppeninfos</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Gruppenname
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enddatum für das Wichteln
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Organizer Info */}
          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">👤 Deine Infos</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dein Name
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deine E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="z.B. max@example.com"
                    className="input-field w-full"
                  />
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={participatesInGroup}
                      onChange={(e) => setParticipatesInGroup(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="font-medium">
                      Ich möchte auch am Wichteln teilnehmen
                    </span>
                  </label>
                  <p className="text-sm text-gray-600 mt-2">
                    Wenn aktiviert, wirst du automatisch als Teilnehmer hinzugefügt und kannst später deine Geschenkeliste anlegen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Participants */}
          {step === 4 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">👥 Teilnehmer einladen</h2>

              <div className="space-y-4">
                {participants.map((p, idx) => (
                  <div key={idx} className="space-y-2 pb-4 border-b border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) =>
                          updateParticipant(idx, 'name', e.target.value)
                        }
                        placeholder="Name"
                        className="input-field"
                      />
                      <input
                        type="email"
                        value={p.email}
                        onChange={(e) =>
                          updateParticipant(idx, 'email', e.target.value)
                        }
                        placeholder="E-Mail (optional)"
                        className="input-field"
                      />
                    </div>
                    {participants.length > 1 && (
                      <button
                        onClick={() => removeParticipant(idx)}
                        className="text-red-600 hover:text-red-700 text-sm font-semibold"
                      >
                        🗑️ Entfernen
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addParticipant}
                  className="w-full btn-outline text-blue-600"
                >
                  + Weiterer Teilnehmer
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Budget */}
          {step === 5 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">💰 Budget</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximales Budget pro Geschenk
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="z.B. 30 €"
                  className="input-field w-full"
                />
              </div>
            </div>
          )}


          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 btn-outline"
              >
                ← Zurück
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {step === 6
                ? loading
                  ? '🔄 Wird erstellt...'
                  : '✅ Gruppe erstellen'
                : 'Weiter →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
