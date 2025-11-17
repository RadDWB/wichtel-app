import { useState } from 'react';

export default function AddParticipants({ group, saveGroup }) {
  const [showExclusions, setShowExclusions] = useState(false);
  const [loading, setLoading] = useState(false);

  const removeParticipant = async (id) => {
    const updated = {
      ...group,
      participants: group.participants.filter(p => p.id !== id),
    };
    await saveGroup(updated);
  };

  const toggleExclusion = async (fromId, toId) => {
    const key = `${fromId}-${toId}`;
    const newExclusions = { ...group.exclusions };

    if (newExclusions[key]) {
      delete newExclusions[key];
    } else {
      newExclusions[key] = true;
    }

    const updated = { ...group, exclusions: newExclusions };
    await saveGroup(updated);
  };

  return (
    <div className="space-y-6">
      {/* Participants List */}
      <div className="card bg-blue-50 border-l-4 border-blue-500">
        <h3 className="section-title">👥 Angemeldete Teilnehmer</h3>

        {group.participants.length > 0 ? (
          <div className="space-y-2">
            {group.participants.map(p => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-white p-3 rounded-lg border-l-4 border-blue-400"
              >
                <div>
                  <p className="font-semibold">{p.name}</p>
                  {p.email && <p className="text-sm text-gray-500">{p.email}</p>}
                </div>
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="btn-outline py-1 px-3 text-red-600 hover:bg-red-100"
                >
                  🗑️ Entfernen
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Noch keine Teilnehmer angemeldet</p>
        )}

        <div className="mt-4 p-4 bg-white rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <strong>{group.participants.length}</strong> Teilnehmer angemeldet
            {group.participants.length >= 3 && (
              <span className="ml-2 text-green-600">✅ Auslosung möglich!</span>
            )}
          </p>
        </div>
      </div>

      {/* Exclusions / Not With */}
      {group.participants.length >= 3 && (
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <button
            onClick={() => setShowExclusions(!showExclusions)}
            className="w-full text-left font-semibold text-purple-700 hover:text-purple-900 flex items-center justify-between"
          >
            <span>🚫 Ausschlüsse setzen</span>
            <span>{showExclusions ? '▼' : '▶'}</span>
          </button>

          {showExclusions && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-700">
                Markiere, mit wem du NICHT zusammen wichteln möchtest. Z.B. mit deinem Partner oder Familie.
              </p>

              {group.participants.map(person => (
                <div key={person.id} className="bg-white p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 text-purple-700">{person.name}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {group.participants
                      .filter(p => p.id !== person.id)
                      .map(other => {
                        const key = `${person.id}-${other.id}`;
                        const isExcluded = group.exclusions?.[key];
                        return (
                          <label
                            key={other.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                              isExcluded
                                ? 'bg-red-100 border-2 border-red-500'
                                : 'bg-gray-100 border-2 border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isExcluded}
                              onChange={() => toggleExclusion(person.id, other.id)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">{other.name}</span>
                          </label>
                        );
                      })}
                  </div>
                </div>
              ))}

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <p className="text-sm text-green-700">
                  ✓ Ausschlüsse sind gespeichert und werden bei der Auslosung berücksichtigt.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}