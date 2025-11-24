export default function SwitchAccountDialog({
  currentParticipantName,
  newParticipantName,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Icon */}
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">👤</div>
            <h2 className="text-2xl font-bold text-gray-900">Benutzer wechseln?</h2>
          </div>

          {/* Message */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded">
            <p className="text-sm text-gray-800 mb-3">
              <strong>Du bist derzeit angemeldet als:</strong>
            </p>
            <p className="text-lg font-bold text-orange-700 mb-3">
              {currentParticipantName}
            </p>
            <p className="text-sm text-gray-700">
              Wenn du dich abmeldest und als <strong>{newParticipantName}</strong> anmeldest, werden deine bisherigen Eingaben in diesem Session nicht mehr abrufbar sein, bis du dich erneut anmeldest.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
            <p className="text-xs text-blue-900">
              💡 <strong>Tipp:</strong> Dies ist sinnvoll, wenn mehrere Personen das gleiche Gerät nutzen.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 px-4 rounded-lg transition"
            >
              ← Abbrechen
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              ✅ Abmelden & Wechseln
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
