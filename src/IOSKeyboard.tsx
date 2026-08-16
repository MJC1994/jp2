import { useState } from "react";

type IOSKeyboardProps = {
  open: boolean;
  onType: (value: string) => void;
  onDelete: () => void;
  onSearch: () => void;
};

const LETTER_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
] as const;

export function IOSKeyboard({
  open,
  onType,
  onDelete,
  onSearch,
}: IOSKeyboardProps) {
  const [shifted, setShifted] = useState(false);

  function typeLetter(letter: string) {
    onType(shifted ? letter.toUpperCase() : letter);
    setShifted(false);
  }

  return (
    <div
      className={`ios-keyboard${open ? " ios-keyboard-open" : ""}`}
      inert
      aria-hidden="true"
    >
      <div className="ios-keyboard-rows">
        <div className="ios-keyboard-row">
          {LETTER_ROWS[0].map((key) => (
            <KeyButton
              key={key}
              label={shifted ? key.toUpperCase() : key}
              onPress={() => typeLetter(key)}
            />
          ))}
        </div>
        <div className="ios-keyboard-row ios-keyboard-row-inset">
          {LETTER_ROWS[1].map((key) => (
            <KeyButton
              key={key}
              label={shifted ? key.toUpperCase() : key}
              onPress={() => typeLetter(key)}
            />
          ))}
        </div>
        <div className="ios-keyboard-row">
          <KeyButton
            className={`ios-key-action${shifted ? " ios-key-shifted" : ""}`}
            label="⇧"
            ariaLabel="Shift"
            onPress={() => setShifted((value) => !value)}
          />
          {LETTER_ROWS[2].map((key) => (
            <KeyButton
              key={key}
              label={shifted ? key.toUpperCase() : key}
              onPress={() => typeLetter(key)}
            />
          ))}
          <KeyButton
            className="ios-key-action"
            label="⌫"
            ariaLabel="Delete"
            onPress={onDelete}
          />
        </div>
        <div className="ios-keyboard-row">
          <KeyButton className="ios-key-wide ios-key-action" label="123" />
          <KeyButton
            className="ios-key-space"
            label="space"
            onPress={() => onType(" ")}
          />
          <button
            type="button"
            className="ios-key ios-key-search"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onSearch}
          >
            search
          </button>
        </div>
      </div>
      <div className="home-indicator home-indicator-keyboard">
        <div className="home-indicator-pill home-indicator-pill-picker" />
      </div>
    </div>
  );
}

function KeyButton({
  label,
  ariaLabel,
  className = "",
  onPress,
}: {
  label: string;
  ariaLabel?: string;
  className?: string;
  onPress?: () => void;
}) {
  return (
    <button
      type="button"
      className={`ios-key ${className}`.trim()}
      aria-label={ariaLabel ?? label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      {label}
    </button>
  );
}
