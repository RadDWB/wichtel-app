import { drawNames } from '../utils/drawAlgorithm';

export default function DrawNames({ group, saveGroup }) {
  const handleDraw = () => {
    if (group.participants.length < 3) {
      alert('Mindestens 3 Teilnehmer nötig!');
      return;
    }

    try {
      const pairing = drawNames(group.participants, group.exclusions || {});
      const updated = {
        ...group,
        drawn: true,
        pairing,
        drawnAt: new Date().toISOString(),
      };
      saveGroup(updated);
      alert('Auslosung erfolgreich! Jeder sieht nur sein Los.');
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  };

  return (
    <div className="section">
      <h3>Namen ziehen</h3>
      <button 
        onClick={handleDraw} 
        disabled={group.participants.length < 3}
        className="draw-button"
      >
        Los geht's! 🎲
      </button>
    </div>
  );
}