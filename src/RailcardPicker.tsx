import { useMemo, useRef, useState } from "react";
import railcardChevron from "./assets/railcard-chevron.svg";
import railcardDivider from "./assets/railcard-divider.svg";
import railcardLogo from "./assets/railcard-logo.svg";
import railcardLogoDark from "./assets/railcard-logo-dark.svg";
import railcardLogoWhite from "./assets/railcard-logo-white.svg";
import railcardMinus from "./assets/railcard-minus.svg";
import railcardPlusH from "./assets/railcard-plus-h.svg";
import railcardPlusV from "./assets/railcard-plus-v.svg";
import railcardSearchHandle from "./assets/railcard-search-handle.svg";
import railcardSearchRing from "./assets/railcard-search-ring.svg";
import { useDialog } from "./useDialog";

const MAX_COUNT = 9;

export const RAILCARD_DEFS = [
  { name: "16-17 Railcard", color: "#f9e836", logo: "dark" },
  { name: "16-25 Railcard", color: "#d77f26", logo: "white" },
  { name: "26-30 Railcard", color: "#b73d1e", logo: "white" },
  { name: "Two Together Railcard", color: "#683f92", logo: "white" },
  { name: "Family & Friends Railcard", color: "#c6042e", logo: "white" },
  { name: "Senior Railcard", color: "#2d336a", logo: "white" },
  { name: "Network Railcard", color: "#5292fb", logo: "white" },
  { name: "Disabled Persons Railcard", color: "#519065", logo: "white" },
  { name: "Veterans Railcard", color: "#6b7881", logo: "white" },
] as const;

const RAILCARDS = RAILCARD_DEFS.map((def) => def.name);

export type RailcardCounts = Record<string, number>;

type RailcardPickerProps = {
  open: boolean;
  counts: RailcardCounts;
  onConfirm: (counts: RailcardCounts) => void;
  onClose: () => void;
  onExited: () => void;
};

function PlusIcon() {
  return (
    <div className="railcard-icon-plus">
      <img className="railcard-plus-v" src={railcardPlusV} alt="" />
      <img className="railcard-plus-h" src={railcardPlusH} alt="" />
    </div>
  );
}

function MinusIcon() {
  return (
    <div className="railcard-icon-plus">
      <img className="railcard-row-minus" src={railcardMinus} alt="" />
    </div>
  );
}

export function emptyRailcards(): RailcardCounts {
  return Object.fromEntries(RAILCARDS.map((name) => [name, 0]));
}

export function railcardTotal(counts: RailcardCounts) {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

export function selectedRailcards(counts: RailcardCounts) {
  return RAILCARD_DEFS.filter((def) => (counts[def.name] ?? 0) > 0).map(
    (def) => ({
      name: def.name,
      color: def.color,
      count: counts[def.name] ?? 0,
    }),
  );
}

export function formatRailcards(counts: RailcardCounts) {
  const selected = selectedRailcards(counts);
  if (selected.length === 0) {
    return "";
  }
  return selected
    .map(
      (item) =>
        `${item.count} ${item.name}${item.count === 1 ? "" : "s"}`,
    )
    .join(", ");
}

export function RailcardSwatch({ name }: { name: string }) {
  const def = RAILCARD_DEFS.find((item) => item.name === name);
  if (!def) {
    return null;
  }
  return (
    <div
      className="railcard-swatch"
      style={{ backgroundColor: def.color }}
      aria-hidden="true"
    >
      <img
        src={def.logo === "dark" ? railcardLogoDark : railcardLogoWhite}
        alt=""
        width={16}
        height={11}
      />
    </div>
  );
}

export function RailcardPicker({
  open,
  counts,
  onConfirm,
  onClose,
  onExited,
}: RailcardPickerProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<RailcardCounts>(counts);
  const dialogRef = useRef<HTMLDivElement>(null);
  const summary = formatRailcards(draft) || "No railcards";
  useDialog(open, onClose, dialogRef);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return RAILCARDS;
    }
    return RAILCARDS.filter((name) => name.toLowerCase().includes(needle));
  }, [query]);

  function setCount(name: string, next: number) {
    setDraft((current) => ({
      ...current,
      [name]: Math.min(MAX_COUNT, Math.max(0, next)),
    }));
  }

  return (
    <div
      className={`date-overlay railcard-overlay${open ? " date-overlay-open" : ""}`}
      onClick={onClose}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === "opacity" &&
          !open
        ) {
          onExited();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={`date-sheet date-sheet-tall${open ? " date-sheet-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="railcard-dialog-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="railcard-sheet-body">
          <div className="sheet-modal-header">
            <div className="sheet-modal-grabber" aria-hidden="true" />
            <h2 className="date-sheet-title" id="railcard-dialog-title">
              Add Railcard
            </h2>
          </div>
          <p className="visually-hidden" aria-live="polite" aria-atomic="true">
            {summary}
          </p>

          <label className="railcard-search">
            <div className="railcard-search-icon" aria-hidden="true">
              <img
                className="railcard-search-ring"
                src={railcardSearchRing}
                alt=""
              />
              <img
                className="railcard-search-handle"
                src={railcardSearchHandle}
                alt=""
              />
            </div>
            <input
              type="text"
              value={query}
              placeholder="Search Railcards"
              aria-label="Search railcards"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="railcard-scroll">
            <button type="button" className="railcard-promo">
              <div className="railcard-promo-copy">
                <div className="railcard-badge">
                  <img className="railcard-badge-logo" src={railcardLogo} alt="" />
                </div>
                <div className="railcard-promo-text">
                  <p className="railcard-promo-title">Buy a Digital Railcard</p>
                  <p className="railcard-promo-sub">
                    Save 1/3 on fares with a Railcard
                  </p>
                </div>
              </div>
              <div className="railcard-promo-chevron">
                <img src={railcardChevron} alt="" width={9} height={18} />
              </div>
            </button>

            <div className="railcard-list">
              {filtered.map((name) => {
                const count = draft[name] ?? 0;
                return (
                  <div className="railcard-item" key={name}>
                    <div className="railcard-item-row">
                      <div className="railcard-item-copy">
                        <RailcardSwatch name={name} />
                        <p className="railcard-item-name">{name}</p>
                      </div>
                      {count === 0 ? (
                        <button
                          type="button"
                          className="railcard-icon-button"
                          aria-label={`Add ${name}`}
                          onClick={() => setCount(name, 1)}
                        >
                          <PlusIcon />
                        </button>
                      ) : (
                        <div className="railcard-item-stepper">
                          <button
                            type="button"
                            className="railcard-icon-button"
                            aria-label={`Remove ${name}`}
                            onClick={() => setCount(name, count - 1)}
                          >
                            <MinusIcon />
                          </button>
                          <p className="railcard-item-count" aria-hidden="true">
                            {count}
                          </p>
                          <button
                            type="button"
                            className="railcard-icon-button"
                            aria-label={`Add ${name}`}
                            disabled={count >= MAX_COUNT}
                            onClick={() => setCount(name, count + 1)}
                          >
                            <PlusIcon />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="railcard-item-rule">
                      <img className="icon-fill" src={railcardDivider} alt="" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            className="railcard-done"
            aria-label={`Done, ${summary}`}
            onClick={() => onConfirm(draft)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
