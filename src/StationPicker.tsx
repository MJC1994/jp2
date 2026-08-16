import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { searchStations } from "fuzzy-stations";
import backArrow from "./assets/back-arrow.svg";
import destinationPin from "./assets/destination-pin.svg";
import dividerLine from "./assets/divider-line.svg";
import iconHomeFill from "./assets/icon-home-fill.svg";
import iconLocation from "./assets/icon-location.svg";
import iconWork from "./assets/icon-work.svg";
import originShape from "./assets/origin-shape.svg";
import pickerPlusH from "./assets/picker-plus-h.svg";
import pickerPlusV from "./assets/picker-plus-v.svg";
import { IOSKeyboard } from "./IOSKeyboard";
import { SavedStationPicker } from "./SavedStationPicker";
import { StatusBar } from "./StatusBar";
import { useDialog } from "./useDialog";

export type StationField = "from" | "to" | "via";
export type ViaMode = "via" | "avoid";

export type StationChoice = {
  name: string;
  code: string;
};

type StationPickerProps = {
  open: boolean;
  activeField: StationField;
  fromStation: string;
  toStation: string;
  viaStation: string;
  viaMode: ViaMode;
  homeStation: StationChoice | null;
  workStation: StationChoice | null;
  onSelectFrom: (station: StationChoice) => void;
  onSelectTo: (station: StationChoice) => void;
  onSelectVia: (station: StationChoice, mode: ViaMode) => void;
  onSetHome: (station: StationChoice | null) => void;
  onSetWork: (station: StationChoice | null) => void;
  onDone: () => void;
  onExited: () => void;
};

function PlusIcon() {
  return (
    <div className="picker-plus">
      <img className="picker-plus-v" src={pickerPlusV} alt="" />
      <img className="picker-plus-h" src={pickerPlusH} alt="" />
    </div>
  );
}

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

function RemoveStationAlert({
  stationName,
  kind,
  onCancel,
  onConfirm,
}: {
  stationName: string;
  kind: "home" | "work";
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const typeLabel = kind === "work" ? "Work" : "Home";
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(true, onCancel, dialogRef);

  return (
    <div className="ios-alert-overlay">
      <div
        ref={dialogRef}
        className="ios-alert"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ios-alert-title"
        aria-describedby="ios-alert-message"
        tabIndex={-1}
      >
        <div className="ios-alert-copy">
          <p className="ios-alert-title" id="ios-alert-title">
            Warning
          </p>
          <p className="ios-alert-message" id="ios-alert-message">
            Are you sure you want to remove {stationName} as your {typeLabel}{" "}
            station?
          </p>
        </div>
        <div className="ios-alert-actions">
          <button
            type="button"
            className="ios-alert-action ios-alert-action-cancel"
            data-dialog-initial-focus
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ios-alert-action ios-alert-action-destructive"
            onClick={onConfirm}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function stationsMatch(a: string, b: string) {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  return left.length > 0 && left === right;
}

const EMPTY_ORIGIN_ERROR = "please enter your origin station";
const EMPTY_DESTINATION_ERROR = "please enter your destination station";

export function StationPicker({
  open,
  activeField,
  fromStation,
  toStation,
  viaStation,
  viaMode,
  homeStation,
  workStation,
  onSelectFrom,
  onSelectTo,
  onSelectVia,
  onSetHome,
  onSetWork,
  onDone,
  onExited,
}: StationPickerProps) {
  const isViaPicker = activeField === "via";
  const [focusedField, setFocusedField] = useState<StationField>(activeField);
  const [fromQuery, setFromQuery] = useState(
    activeField === "from" ? "" : fromStation,
  );
  const [toQuery, setToQuery] = useState(activeField === "to" ? "" : toStation);
  const [viaQuery, setViaQuery] = useState(isViaPicker ? viaStation : "");
  const [viaModeDraft, setViaModeDraft] = useState<ViaMode>(viaMode);
  const [fromError, setFromError] = useState("");
  const [toError, setToError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(true);
  const [savedKind, setSavedKind] = useState<"home" | "work" | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{
    kind: "home" | "work";
    station: StationChoice;
  } | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const viaRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragOffset = useRef(0);
  const suppressScrollDismiss = useRef(false);
  const destinationChosenThisSession = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(
    open,
    onDone,
    dialogRef,
    open && !savedKind && !pendingRemove,
  );

  function inputFor(field: StationField) {
    if (field === "from") {
      return fromRef.current;
    }
    if (field === "to") {
      return toRef.current;
    }
    return viaRef.current;
  }

  function queryFor(field: StationField) {
    if (field === "from") {
      return fromQuery;
    }
    if (field === "to") {
      return toQuery;
    }
    return viaQuery;
  }

  function focusField(field: StationField, selectExisting: boolean) {
    setFocusedField(field);
    setIsEditing(false);
    requestAnimationFrame(() => {
      const input = inputFor(field);
      input?.focus({ preventScroll: true });
      if (selectExisting && input?.value) {
        input.select();
      }
    });
  }

  useEffect(() => {
    focusField(activeField, false);
  }, [activeField]);

  const activeQuery = queryFor(focusedField);
  const results = useMemo(
    () =>
      isEditing && activeQuery.trim()
        ? searchStations(activeQuery, { limit: 12, types: ["rail"] })
        : [],
    [activeQuery, isEditing],
  );
  const isSearching = isEditing && activeQuery.trim().length > 0;
  const sameStationError = isViaPicker
    ? stationsMatch(viaQuery, fromStation) || stationsMatch(viaQuery, toStation)
    : stationsMatch(fromQuery, toQuery);

  useEffect(() => {
    suppressScrollDismiss.current = true;
    scrollRef.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => {
      suppressScrollDismiss.current = false;
    });
  }, [activeQuery, isSearching]);

  function hideKeyboard() {
    setKeyboardOpen(false);
    inputFor(focusedField)?.blur();
  }

  function revealKeyboard() {
    setKeyboardOpen(true);
  }

  function onListScrollIntent() {
    if (suppressScrollDismiss.current || !keyboardOpen) {
      return;
    }
    hideKeyboard();
  }

  function updateQuery(field: StationField, value: string) {
    setIsEditing(true);
    if (field === "from") {
      setFromQuery(value);
      setFromError("");
    } else if (field === "to") {
      setToQuery(value);
      setToError("");
    } else {
      setViaQuery(value);
    }
  }

  function clearField(field: StationField) {
    updateQuery(field, "");
    inputFor(field)?.focus({ preventScroll: true });
  }

  function applyFrom(station: StationChoice) {
    const destinationAlreadyFilled = toQuery.trim().length > 0;
    setFromQuery(station.name);
    onSelectFrom(station);
    if (stationsMatch(station.name, toQuery)) {
      focusField("to", true);
      return;
    }
    if (destinationAlreadyFilled && destinationChosenThisSession.current) {
      onDone();
      return;
    }
    focusField("to", destinationAlreadyFilled);
  }

  function applyTo(station: StationChoice) {
    destinationChosenThisSession.current = true;
    setToQuery(station.name);
    onSelectTo(station);
    if (stationsMatch(fromQuery, station.name)) {
      return;
    }
    if (fromQuery.trim()) {
      onDone();
      return;
    }
    focusField("from", false);
  }

  function applyVia(station: StationChoice) {
    setViaQuery(station.name);
    if (
      stationsMatch(station.name, fromStation) ||
      stationsMatch(station.name, toStation)
    ) {
      return;
    }
    onSelectVia(station, viaModeDraft);
    onDone();
  }

  function chooseViaMode(mode: ViaMode) {
    setViaModeDraft(mode);
    if (
      viaStation &&
      viaQuery === viaStation &&
      !stationsMatch(viaStation, fromStation) &&
      !stationsMatch(viaStation, toStation)
    ) {
      onSelectVia({ name: viaStation, code: "" }, mode);
    }
  }

  function pickStation(station: StationChoice) {
    if (isViaPicker) {
      applyVia(station);
      return;
    }
    if (focusedField === "from") {
      applyFrom(station);
      return;
    }
    applyTo(station);
  }

  function openSavedPicker(kind: "home" | "work") {
    hideKeyboard();
    setSavedKind(kind);
    setSavedOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSavedOpen(true));
    });
  }

  function closeSavedPicker() {
    setSavedOpen(false);
  }

  function requestRemoveSaved(kind: "home" | "work", station: StationChoice) {
    setPendingRemove({ kind, station });
  }

  function confirmRemoveSaved() {
    if (!pendingRemove) {
      return;
    }
    if (pendingRemove.kind === "work") {
      onSetWork(null);
    } else {
      onSetHome(null);
    }
    setPendingRemove(null);
  }

  function typeIntoFocusedField(value: string) {
    const current = queryFor(focusedField);
    const input = inputFor(focusedField);
    const hasSelection =
      !!input &&
      input.selectionStart !== null &&
      input.selectionEnd !== null &&
      input.selectionStart !== input.selectionEnd;
    const next = hasSelection
      ? current.slice(0, input.selectionStart ?? 0) +
        value +
        current.slice(input.selectionEnd ?? 0)
      : current + value;
    updateQuery(focusedField, next);
  }

  function deleteFromFocusedField() {
    const current = queryFor(focusedField);
    const input = inputFor(focusedField);
    const hasSelection =
      !!input &&
      input.selectionStart !== null &&
      input.selectionEnd !== null &&
      input.selectionStart !== input.selectionEnd;
    if (hasSelection) {
      updateQuery(
        focusedField,
        current.slice(0, input.selectionStart ?? 0) +
          current.slice(input.selectionEnd ?? 0),
      );
      return;
    }
    updateQuery(focusedField, current.slice(0, -1));
  }

  function topSearchStation(): StationChoice | null {
    if (!isSearching || !results[0]) {
      return null;
    }
    return {
      name: results[0].station.name,
      code: results[0].station.crs ?? "",
    };
  }

  function applyOriginFromReturn(station: StationChoice) {
    setFromQuery(station.name);
    setFromError("");
    onSelectFrom(station);
    focusField("to", toQuery.trim().length > 0);
  }

  function applyDestinationFromReturn(station: StationChoice) {
    setToQuery(station.name);
    setToError("");
    destinationChosenThisSession.current = true;
    onSelectTo(station);
    if (stationsMatch(fromQuery, station.name)) {
      return;
    }
    if (fromQuery.trim()) {
      onDone();
      return;
    }
    focusField("from", false);
  }

  function confirmOriginReturn() {
    const top = topSearchStation();
    if (top) {
      applyOriginFromReturn(top);
      return;
    }
    if (!fromQuery.trim() || isSearching) {
      setFromError(EMPTY_ORIGIN_ERROR);
      return;
    }
    applyOriginFromReturn({ name: fromQuery.trim(), code: "" });
  }

  function confirmDestinationReturn() {
    const top = topSearchStation();
    if (top) {
      applyDestinationFromReturn(top);
      return;
    }
    if (!toQuery.trim() || isSearching) {
      setToError(EMPTY_DESTINATION_ERROR);
      return;
    }
    applyDestinationFromReturn({ name: toQuery.trim(), code: "" });
  }

  function confirmSearch() {
    if (isViaPicker) {
      const top = topSearchStation();
      if (top) {
        applyVia(top);
      }
      return;
    }
    if (focusedField === "from") {
      confirmOriginReturn();
      return;
    }
    confirmDestinationReturn();
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
      onDone();
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
      className={`station-sheet${open && dragY === 0 && !isDragging ? " station-sheet-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-dialog-title"
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
      <div className="phone-picker">
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
          aria-label="Close"
          onClick={onDone}
        >
          <div className="picker-back-icon">
            <img className="icon-fill" src={backArrow} alt="" />
          </div>
        </button>
        <h2
          className="picker-title"
          id="station-dialog-title"
          onTouchStart={onSheetPointerDown}
          onTouchMove={onSheetPointerMove}
          onTouchEnd={onSheetPointerUp}
          onTouchCancel={onSheetPointerUp}
        >
          {isViaPicker ? "Via or avoid" : "Plan your journey"}
        </h2>
      </div>

      <div
        className={`picker-body${keyboardOpen ? " picker-body-with-keyboard" : ""}`}
      >
        <div className="picker-fields">
          {isViaPicker ? (
            <>
              <div
                className="via-mode"
                role="tablist"
                aria-label="Via or avoid"
              >
                <button
                  type="button"
                  className={`via-mode-option${
                    viaModeDraft === "via" ? " via-mode-option-active" : ""
                  }`}
                  role="tab"
                  aria-selected={viaModeDraft === "via"}
                  onClick={() => chooseViaMode("via")}
                >
                  Via
                </button>
                <button
                  type="button"
                  className={`via-mode-option${
                    viaModeDraft === "avoid" ? " via-mode-option-active" : ""
                  }`}
                  role="tab"
                  aria-selected={viaModeDraft === "avoid"}
                  onClick={() => chooseViaMode("avoid")}
                >
                  Avoid
                </button>
              </div>
              <label
                className={`picker-field${
                  focusedField === "via" ? " picker-field-focused" : ""
                }${sameStationError ? " picker-field-error" : ""}`}
              >
                <div className="picker-field-icon">
                  <div className="destination-pin">
                    <img className="icon-fill" src={destinationPin} alt="" />
                  </div>
                </div>
                <input
                  ref={viaRef}
                  type="text"
                  inputMode="none"
                  enterKeyHint="search"
                  value={viaQuery}
                  placeholder="Station"
                  aria-label={
                    viaModeDraft === "avoid" ? "Avoid station" : "Via station"
                  }
                  data-dialog-initial-focus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-invalid={sameStationError}
                  aria-describedby={
                    sameStationError ? "picker-via-station-error" : undefined
                  }
                  onFocus={() => {
                    setFocusedField("via");
                    setIsEditing(false);
                    revealKeyboard();
                    if (viaQuery) {
                      requestAnimationFrame(() => viaRef.current?.select());
                    }
                  }}
                  onClick={revealKeyboard}
                  onChange={(event) => updateQuery("via", event.target.value)}
                />
                {viaQuery ? (
                  <ClearButton
                    label="Clear station"
                    onClear={() => clearField("via")}
                  />
                ) : null}
              </label>
              {sameStationError ? (
                <p
                  className="picker-field-error-text"
                  id="picker-via-station-error"
                  role="alert"
                >
                  Cannot be the same as origin or destination
                </p>
              ) : null}
            </>
          ) : (
            <>
          <div className="picker-field-block">
          <label
            className={`picker-field${
              focusedField === "from" ? " picker-field-focused" : ""
            }${fromError ? " picker-field-error" : ""}`}
          >
            <div className="picker-field-icon">
              <div className="origin-pin">
                <img className="icon-fill" src={originShape} alt="" />
              </div>
            </div>
            <input
              ref={fromRef}
              type="text"
              inputMode="none"
              enterKeyHint="search"
              value={fromQuery}
              placeholder="Leaving from… "
              aria-label="Leaving from"
              data-dialog-initial-focus={focusedField === "from" ? true : undefined}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={Boolean(fromError)}
              aria-describedby={fromError ? "picker-origin-error" : undefined}
              onFocus={() => {
                setFocusedField("from");
                setIsEditing(false);
                revealKeyboard();
                if (fromQuery) {
                  requestAnimationFrame(() => fromRef.current?.select());
                }
              }}
              onClick={revealKeyboard}
              onChange={(event) => updateQuery("from", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmOriginReturn();
                }
              }}
            />
            {focusedField === "from" && fromQuery ? (
              <ClearButton
                label="Clear leaving from"
                onClear={() => clearField("from")}
              />
            ) : null}
          </label>
          {fromError ? (
            <p
              className="picker-field-error-text"
              id="picker-origin-error"
              role="alert"
            >
              {fromError}
            </p>
          ) : null}
          </div>
          <div className="picker-destination">
          <label
            className={`picker-field${
              focusedField === "to" ? " picker-field-focused" : ""
            }${sameStationError || toError ? " picker-field-error" : ""}`}
          >
            <div className="picker-field-icon">
              <div className="destination-pin">
                <img className="icon-fill" src={destinationPin} alt="" />
              </div>
            </div>
            <input
              ref={toRef}
              type="text"
              inputMode="none"
              enterKeyHint="search"
              value={toQuery}
              placeholder="Going to… "
              aria-label="Going to"
              data-dialog-initial-focus={focusedField === "to" ? true : undefined}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={sameStationError || Boolean(toError)}
              aria-describedby={
                toError
                  ? "picker-destination-error"
                  : sameStationError
                    ? "picker-same-station-error"
                    : undefined
              }
              onFocus={() => {
                setFocusedField("to");
                setIsEditing(false);
                revealKeyboard();
                if (toQuery) {
                  requestAnimationFrame(() => toRef.current?.select());
                }
              }}
              onClick={revealKeyboard}
              onChange={(event) => updateQuery("to", event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirmDestinationReturn();
                }
              }}
            />
            {focusedField === "to" && toQuery ? (
              <ClearButton
                label="Clear going to"
                onClear={() => clearField("to")}
              />
            ) : null}
          </label>
          {toError ? (
            <p
              className="picker-field-error-text"
              id="picker-destination-error"
              role="alert"
            >
              {toError}
            </p>
          ) : sameStationError ? (
            <p
              className="picker-field-error-text"
              id="picker-same-station-error"
              role="alert"
            >
              Origin and destination cannot be the same
            </p>
          ) : null}
          </div>
            </>
          )}
        </div>

        <div
          className="picker-scroll"
          ref={scrollRef}
          onWheel={onListScrollIntent}
          onTouchMove={onListScrollIntent}
          onScroll={onListScrollIntent}
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
              {isViaPicker ? null : (
                <>
              <div className="picker-section-title picker-section-title-compact">
                <p>Your Stations</p>
              </div>

              <div className="picker-saved">
                <Divider />
                {workStation ? (
                  <div className="picker-saved-row picker-saved-row-filled">
                    <button
                      type="button"
                      className="picker-saved-main picker-station-button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickStation(workStation)}
                    >
                      <div className="picker-badge">
                        <div className="picker-badge-icon">
                          <img className="icon-fill" src={iconWork} alt="" />
                        </div>
                      </div>
                      <div className="picker-saved-copy">
                        <p className="picker-saved-name">{workStation.name}</p>
                        <p className="picker-saved-kind">Work</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="picker-saved-clear"
                      aria-label="Remove Work station"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => requestRemoveSaved("work", workStation)}
                    >
                      <div className="picker-plus picker-plus-close">
                        <img className="picker-plus-v" src={pickerPlusV} alt="" />
                        <img className="picker-plus-h" src={pickerPlusH} alt="" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="picker-saved-row picker-station-button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openSavedPicker("work")}
                  >
                    <div className="picker-saved-left">
                      <div className="picker-badge">
                        <div className="picker-badge-icon">
                          <img className="icon-fill" src={iconWork} alt="" />
                        </div>
                      </div>
                      <p>Set Work station</p>
                    </div>
                    <PlusIcon />
                  </button>
                )}
                <Divider />
                {homeStation ? (
                  <div className="picker-saved-row picker-saved-row-filled">
                    <button
                      type="button"
                      className="picker-saved-main picker-station-button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pickStation(homeStation)}
                    >
                      <div className="picker-badge">
                        <div className="picker-badge-icon">
                          <img className="icon-fill" src={iconHomeFill} alt="" />
                        </div>
                      </div>
                      <div className="picker-saved-copy">
                        <p className="picker-saved-name">{homeStation.name}</p>
                        <p className="picker-saved-kind">Home</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="picker-saved-clear"
                      aria-label="Remove Home station"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => requestRemoveSaved("home", homeStation)}
                    >
                      <div className="picker-plus picker-plus-close">
                        <img className="picker-plus-v" src={pickerPlusV} alt="" />
                        <img className="picker-plus-h" src={pickerPlusH} alt="" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="picker-saved-row picker-station-button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openSavedPicker("home")}
                  >
                    <div className="picker-saved-left">
                      <div className="picker-badge">
                        <div className="picker-badge-icon">
                          <img className="icon-fill" src={iconHomeFill} alt="" />
                        </div>
                      </div>
                      <p>Set Home station</p>
                    </div>
                    <PlusIcon />
                  </button>
                )}
                <Divider />
              </div>
                </>
              )}

              <div className="picker-section-title">
                <p>Nearest Stations</p>
              </div>
              <button
                type="button"
                className="picker-station-row picker-station-button"
                onMouseDown={(event) => event.preventDefault()}
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

      {savedKind ? null : (
        <div className="home-indicator">
          <div className="home-indicator-pill home-indicator-pill-picker" />
        </div>
      )}
      {savedKind ? null : (
        <IOSKeyboard
          open={keyboardOpen}
          onType={typeIntoFocusedField}
          onDelete={deleteFromFocusedField}
          onSearch={confirmSearch}
        />
      )}
      {savedKind ? (
        <SavedStationPicker
          kind={savedKind}
          open={savedOpen}
          onSelect={(station) => {
            if (savedKind === "work") {
              onSetWork(station);
            } else {
              onSetHome(station);
            }
            closeSavedPicker();
          }}
          onClose={closeSavedPicker}
          onExited={() => setSavedKind(null)}
        />
      ) : null}
      {pendingRemove ? (
        <RemoveStationAlert
          stationName={pendingRemove.station.name}
          kind={pendingRemove.kind}
          onCancel={() => setPendingRemove(null)}
          onConfirm={confirmRemoveSaved}
        />
      ) : null}
      </div>
    </div>
  );
}
