import { useState } from 'react';

export default function PinInput({
  value,
  onChange,
  placeholder = 'PIN eingeben',
  maxLength = '6',
  autoFocus = false,
  className = 'input-field w-full',
  inputMode = 'numeric',
  showLabel = true,
  label = 'PIN',
  onKeyPress,
}) {
  const [showPin, setShowPin] = useState(false);

  return (
    <div>
      {showLabel && (
        <label className="block text-sm font-medium mb-2 text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showPin ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          inputMode={inputMode}
          className={className}
        />
        <button
          type="button"
          onClick={() => setShowPin(!showPin)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
          title={showPin ? 'PIN verbergen' : 'PIN anzeigen'}
        >
          {showPin ? (
            <span className="text-lg">🙈</span>
          ) : (
            <span className="text-lg">👁️</span>
          )}
        </button>
      </div>
    </div>
  );
}
