import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';

export default function CreateGroup({ onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [budget, setBudget] = useState('');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    const id = uuidv4().slice(0, 8);
    const group = {
      id,
      name: groupName || 'Meine Wichtelrunde',
      budget: budget || '20 €',
      participants: [],
      exclusions: {},
      drawn: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(`group_${id}`, JSON.stringify(group));
    onGroupCreated(id);
    router.push(`/${id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <input
        type="text"
        placeholder="Gruppenname (optional)"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Max. Budget (z.B. 20 €)"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      />
      <button type="submit">Gruppe anlegen</button>
    </form>
  );
}