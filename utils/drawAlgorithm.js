export function drawNames(participants, exclusions = {}) {
  const ids = participants.map(p => p.id);
  let shuffled = [...ids];
  let attempts = 0;
  const maxAttempts = 100;

  // Convert exclusions format: "fromId-toId" -> check if exclusion exists
  const isExcluded = (fromId, toId) => {
    return exclusions[`${fromId}-${toId}`] === true;
  };

  while (attempts < maxAttempts) {
    shuffled = shuffle([...ids]);
    const pairing = {};
    let valid = true;

    for (let i = 0; i < ids.length; i++) {
      const giver = ids[i];
      const receiver = shuffled[i];

      if (receiver === giver || isExcluded(giver, receiver)) {
        valid = false;
        break;
      }
      pairing[giver] = receiver;
    }

    if (valid) return pairing;
    attempts++;
  }

  throw new Error('Keine gültige Auslosung möglich. Probiere andere Ausschlüsse.');
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}