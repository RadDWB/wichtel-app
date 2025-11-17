// Anlässe für Wichteln
export const OCCASIONS = [
  { id: 'christmas', label: '🎄 Weihnachten', defaultName: 'Weihnachtswichteln' },
  { id: 'wichteln', label: '🎁 Wichteln', defaultName: 'Wichtelrunde' },
  { id: 'nikolaus', label: '🎅 Nikolaus', defaultName: 'Nikolaus-Wichteln' },
  { id: 'silvester', label: '🥂 Silvester', defaultName: 'Silvester-Wichteln' },
  { id: 'birthday', label: '🎂 Geburtstag', defaultName: 'Geburtstags-Wichteln' },
  { id: 'wedding', label: '💒 Hochzeit', defaultName: 'Hochzeits-Wichteln' },
  { id: 'valentine', label: '💝 Valentinstag', defaultName: 'Valentinstags-Wichteln' },
  { id: 'motherday', label: '👩 Muttertag', defaultName: 'Muttertags-Wichteln' },
  { id: 'fatherday', label: '👨 Vatertag', defaultName: 'Vatertags-Wichteln' },
  { id: 'easter', label: '🐰 Ostern', defaultName: 'Oster-Wichteln' },
  { id: 'ramadan', label: '🌙 Ramadan/Bayram', defaultName: 'Ramadan-Wichteln' },
  { id: 'kurban', label: '🕌 Opferfest', defaultName: 'Opferfest-Wichteln' },
  { id: 'other', label: '✨ Sonstiges', defaultName: 'Wichtelrunde' },
];

export const getOccasionLabel = (id) => {
  return OCCASIONS.find(o => o.id === id)?.label || '✨ Sonstiges';
};

export const getDefaultName = (id) => {
  return OCCASIONS.find(o => o.id === id)?.defaultName || 'Wichtelrunde';
};
