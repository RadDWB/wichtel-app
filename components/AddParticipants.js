import { useState } from 'react';

export default function AddParticipants({ group, saveGroup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const addParticipant = () => {
    if (!name.trim()) return;
    const newParticipant = { id: Date.now().toString(), name, email: email || null };
    const updated = {
      ...group,
      participants: [...group.participants, newParticipant],
    };
    saveGroup(updated);
    setName('');
    setEmail('');
  };

  const removeParticipant = (id) => {
    const updated = {
      ...group,
      participants: group.participants.filter(p => p.id !== id),
    };
    saveGroup(updated);
  };

  return (
    <div className="section">
      <h3>Teilnehmer hinzufügen</h3>
      <div className="input-group">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="E-Mail (optional)" value={email} onChange={e => setEmail(e.target.value)} />
        <button onClick={addParticipant}>Hinzufügen</button>
      </div>

      <ul className="participant-list">
        {group.participants.map(p => (
          <li key={p.id}>
            <strong>{p.name}</strong> {p.email && <span className="email">({p.email})</span>}
            <button onClick={() => removeParticipant(p.id)} className="remove">×</button>
          </li>
        ))}
      </ul>

      {group.participants.length >= 3 && (
        <p className="success">✓ Mindestens 3 Teilnehmer – Auslosung möglich!</p>
      )}
    </div>
  );
}