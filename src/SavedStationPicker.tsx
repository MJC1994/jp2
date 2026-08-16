import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { searchStations } from "fuzzy-stations";
import backArrow from "./assets/back-arrow.svg";
import dividerLine from "./assets/divider-line.svg";
import iconLocation from "./assets/icon-location.svg";
import savedSearchHandle from "./assets/saved-search-handle.svg";
import savedSearchRing from "./assets/saved-search-ring.svg";
import { IOSKeyboard } from "./IOSKeyboard";
import { StatusBar } from "./StatusBar";
import { useDialog } from "./useDialog";

type SavedKind = "home" | "work";

type StationChoice = {
  name: string;
  code: string;
};

type SavedStationPickerProps = {
  kind: SavedKind;
  open: boolean;
  onSelect: (station: StationChoice) => void;
  onClose: () => void;
  onExited: () => void;
};

function Divider() {
  return (
    <div className="picker-divider">
      <img className="icon-fill" src={dividerLine} alt="" />
    </div>
  );
}

function ClearButton({
  onClear,
  label = "Clear",
}: {
  onClear: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="picker-clear"
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClear}
    >
      ×
    </button>
  );
}

export function SavedStationPicker({
  kind,
  open,
  onSelect,
  onClose,
  onExited,
}: SavedStationPickerProps) {
  const [query, setQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragOffset = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const title = kind === "work" ? "Add Work station" : "Add Home station";
  useDialog(open, onClose, dialogRef);
  const results = useMemo(
    () =>
      isEditing && query.trim()
        ? searchStations(query, { limit: 12, types: ["rail"] })
        : [],
    [isEditing, query],
  );
  const isSearching = isEditing && query.trim().length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [query, isSearching]);

  function revealKeyboard() {
    setKeyboardOpen(true);
  }

  function hideKeyboard() {
    setKeyboardOpen(false);
    inputRef.current?.blur();
  }

  function updateQuery(value: string) {
    setIsEditing(true);
    setQuery(value);
  }

  function typeIntoQuery(value: string) {
    const input = inputRef.current;
    const hasSelection =
      !!input &&
      input.selectionStart !== null &&
      input.selectionEnd !== null &&
      input.selectionStart !== input.selectionEnd;
    const next = hasSelection
      ? query.slice(0, input.selectionStart ?? 0) +
        value +
        query.slice(input.selectionEnd ?? 0)
      : query + value;
    updateQuery(next);
  }

  function deleteFromQuery() {
    const input = inputRef.current;
    const hasSelection =
      !!input &&
      input.selectionStart !== null &&
      input.selectionEnd !== null &&
      input.selectionStart !== input.selectionEnd;
    if (hasSelection) {
      updateQuery(
        query.slice(0, input.selectionStart ?? 0) +
          query.slice(input.selectionEnd ?? 0),
      );
      return;
    }
    updateQuery(query.slice(0, -1));
  }

  function confirmSearch() {
    const top = isSearching && results[0] ? results[0].station : null;
    if (!top) {
      return;
    }
    pickStation({ name: top.name, code: top.crs ?? "" });
  }

  function pickStation(station: StationChoice) {
    hideKeyboard();
    onSelect(station);
  }

  function dismiss() {
    hideKeyboard();
    onClose();
  }

  function onSheetPointerDown(event: TouchEvent<HTMLElement>) {
    dragStartY.current = event.touches[0].clientY;
    dragOffset.current = 0;
    setIsDragging(true);
  }

  function onSheetPointerMove(event: TouchEvent<HTMLElement>) {
    if (!isDragging) {
      return;
    }
    const offset = Math.max(0, event.touches[0].clientY - dragStartY.current);
    dragOffset.current = offset;
    setDragY(offset);
  }

  function onSheetPointerUp() {
    if (!isDragging) {
      return;
    }
    setIsDragging(false);
    if (dragOffset.current > 110) {
      setDragY(0);
      dismiss();
      return;
    }
    setDragY(0);
  }

  const sheetStyle =
    isDragging || dragY > 0
      ? {
          transform: `translate3d(0, ${dragY}px, 0)`,
          transition: isDragging ? "none" : undefined,
        }
      : undefined;

  return (
    <div
      ref={dialogRef}
      className={`saved-station-overlay${
        open && dragY === 0 && !isDragging ? " saved-station-overlay-open" : ""
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="saved-station-dialog-title"
      tabIndex={-1}
      style={sheetStyle}
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === "transform" &&
          !open
        ) {
          onExited();
        }
      }}
    >
      <div
        className="sheet-grabber-hit"
        onTouchStart={onSheetPointerDown}
        onTouchMove={onSheetPointerMove}
        onTouchEnd={onSheetPointerUp}
        onTouchCancel={onSheetPointerUp}
      >
        <div className="sheet-grabber" aria-hidden="true" />
      </div>
      <StatusBar variant="light" />
      <div className="picker-header">
        <button
          type="button"
          className="picker-back"
          aria-label="Back"
          onClick={dismiss}
        >
          <div className="picker-back-icon">
            <img className="icon-fill" src={backArrow} alt="" />
          </div>
        </button>
        <h2
          className="picker-title"
          id="saved-station-dialog-title"
          onTouchStart={onSheetPointerDown}
          onTouchMove={onSheetPointerMove}
          onTouchEnd={onSheetPointerUp}
          onTouchCancel={onSheetPointerUp}
        >
          {title}
        </h2>
      </div>

      <div
        className={`saved-station-body${
          keyboardOpen ? " picker-body-with-keyboard" : ""
        }`}
      >
        <div className="saved-search-wrap">
          <label
            className={`saved-search${keyboardOpen ? " saved-search-focused" : ""}`}
          >
            <div className="saved-search-icon" aria-hidden="true">
              <img className="saved-search-ring" src={savedSearchRing} alt="" />
              <img
                className="saved-search-handle"
                src={savedSearchHandle}
                alt=""
              />
            </div>
            <input
              ref={inputRef}
              type="text"
              inputMode="none"
              enterKeyHint="search"
              value={query}
              placeholder="Type station or 3 letter station code"
              aria-label="Search stations"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onFocus={() => {
                setIsEditing(false);
                revealKeyboard();
                if (query) {
                  requestAnimationFrame(() => inputRef.current?.select());
                }
              }}
              onClick={revealKeyboard}
              onChange={(event) => updateQuery(event.target.value)}
            />
            {query ? (
              <ClearButton
                label="Clear search"
                onClear={() => updateQuery("")}
              />
            ) : null}
          </label>
        </div>

        <div
          className="picker-scroll"
          ref={scrollRef}
          onWheel={hideKeyboard}
          onTouchMove={hideKeyboard}
          onScroll={hideKeyboard}
        >
          {isSearching ? (
            results.length > 0 ? (
              results.map((result, index) => (
                <button
                  key={`${result.station.id}-${result.station.nlc ?? ""}`}
                  type="button"
                  className={`picker-station-row picker-station-button${
                    index > 0 ? " picker-station-row-overlap" : ""
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    pickStation({
                      name: result.station.name,
                      code: result.station.crs ?? "",
                    })
                  }
                >
                  <Divider />
                  <div className="picker-station-row-inner picker-recent">
                    <p className="picker-station-name">{result.station.name}</p>
                    {result.station.crs ? (
                      <p className="picker-station-code">{result.station.crs}</p>
                    ) : null}
                  </div>
                  <Divider />
                </button>
              ))
            ) : (
              <p className="picker-empty" role="status">
                No stations found
              </p>
            )
          ) : (
            <>
              <div className="picker-section-title">
                <p>Nearest Stations</p>
              </div>
              <button
                type="button"
                className="picker-station-row picker-station-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() =>
                  pickStation({ name: "Clapham Junction", code: "CLJ" })
                }
              >
                <Divider />
                <div className="picker-station-row-inner">
                  <div className="location-icon">
                    <img className="icon-fill" src={iconLocation} alt="" />
                  </div>
                  <p className="picker-link">Use my current location</p>
                </div>
                <Divider />
              </button>

              <div className="picker-section-title">
                <p>Recent Stations</p>
              </div>
              <button
                type="button"
                className="picker-station-row picker-station-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pickStation({ name: "Woking", code: "WOK" })}
              >
                <Divider />
                <div className="picker-station-row-inner picker-recent">
                  <p className="picker-station-name">Woking</p>
                  <p className="picker-station-code">WOK</p>
                </div>
                <Divider />
              </button>
              <button
                type="button"
                className="picker-station-row picker-station-button picker-station-row-overlap"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pickStation({ name: "Tonbridge", code: "TON" })}
              >
                <Divider />
                <div className="picker-station-row-inner picker-recent">
                  <p className="picker-station-name">Tonbridge</p>
                  <p className="picker-station-code">TON</p>
                </div>
                <Divider />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="home-indicator">
        <div className="home-indicator-pill home-indicator-pill-picker" />
      </div>
      <IOSKeyboard
        open={keyboardOpen}
        onType={typeIntoQuery}
        onDelete={deleteFromQuery}
        onSearch={confirmSearch}
      />
    </div>
  );
}
