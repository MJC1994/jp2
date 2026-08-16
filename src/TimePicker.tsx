import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useDialog } from "./useDialog";

export type TimeField = "outbound" | "return";
export type TimeMode = "departing" | "arriveBy";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
const ITEM_HEIGHT = 32;
const COPIES = 3;

type TimePickerProps = {
  open: boolean;
  field: TimeField;
  time: string;
  mode: TimeMode;
  onConfirm: (time: string, mode: TimeMode) => void;
  onClose: () => void;
  onExited: () => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parsePlannerTime(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  return {
    hour: Number.isFinite(hour) ? hour : 11,
    minute: Number.isFinite(minute) ? minute : 30,
  };
}

export function formatPlannerTime(hour: number, minute: number) {
  return `${pad(hour)}:${pad(minute)}`;
}

function wrapIndex(index: number, length: number) {
  return ((index % length) + length) % length;
}

function nearestFiveMinutes(date: Date) {
  const total = date.getHours() * 60 + date.getMinutes();
  const rounded = Math.round(total / 5) * 5;
  const wrapped = ((rounded % (24 * 60)) + 24 * 60) % (24 * 60);
  return {
    hour: Math.floor(wrapped / 60),
    minute: wrapped % 60,
  };
}

function WheelColumn({
  values,
  selected,
  onSelect,
  label,
  unit,
}: {
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
  label: string;
  unit: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef(0);
  const dragging = useRef(false);
  const lastY = useRef(0);
  const selectedIndex = Math.max(0, values.indexOf(selected));
  const items = Array.from({ length: COPIES }, (_, copy) =>
    values.map((value, index) => ({
      key: `${copy}-${value}`,
      value,
      index,
      copy,
    })),
  ).flat();

  function scrollToIndex(index: number, behavior: ScrollBehavior = "auto") {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({
      top: (values.length + index) * ITEM_HEIGHT,
      behavior,
    });
  }

  function indexFromScroll(scrollTop: number) {
    return wrapIndex(Math.round(scrollTop / ITEM_HEIGHT), values.length);
  }

  function settle() {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const index = indexFromScroll(el.scrollTop);
    onSelect(values[index]);
    const target = (values.length + index) * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) {
      el.scrollTo({ top: target, behavior: "instant" });
    }
  }

  useLayoutEffect(() => {
    scrollToIndex(selectedIndex);
  }, []);

  useEffect(() => {
    if (dragging.current) {
      return;
    }
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    if (indexFromScroll(el.scrollTop) === selectedIndex) {
      return;
    }
    scrollToIndex(selectedIndex);
  }, [selectedIndex]);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const index = indexFromScroll(el.scrollTop);
    if (values[index] !== selected) {
      onSelect(values[index]);
    }
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settle, 80);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") {
      return;
    }
    dragging.current = true;
    lastY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) {
      return;
    }
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.scrollTop -= event.clientY - lastY.current;
    lastY.current = event.clientY;
  }

  function onPointerUp() {
    if (!dragging.current) {
      return;
    }
    dragging.current = false;
    settle();
  }

  function step(delta: number) {
    const index = Math.max(0, values.indexOf(selected));
    onSelect(values[wrapIndex(index + delta, values.length)]);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      step(1);
    } else if (event.key === "Home") {
      event.preventDefault();
      onSelect(values[0]);
    } else if (event.key === "End") {
      event.preventDefault();
      onSelect(values[values.length - 1]);
    }
  }

  return (
    <div
      className="time-wheel-col"
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={values[0]}
      aria-valuemax={values[values.length - 1]}
      aria-valuenow={selected}
      aria-valuetext={`${pad(selected)} ${unit}`}
      onKeyDown={onKeyDown}
    >
      <div className="time-wheel-highlight" aria-hidden="true" />
      <div
        className="time-wheel-scroller"
        ref={scrollerRef}
        tabIndex={-1}
        aria-hidden="true"
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {items.map((item) => (
          <button
            type="button"
            tabIndex={-1}
            className={`time-wheel-item${
              item.value === selected ? " time-wheel-item-active" : ""
            }`}
            key={item.key}
            onClick={() => {
              onSelect(item.value);
              scrollToIndex(item.index, "smooth");
            }}
          >
            {pad(item.value)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TimePicker({
  open,
  field,
  time,
  mode,
  onConfirm,
  onClose,
  onExited,
}: TimePickerProps) {
  const initial = parsePlannerTime(time);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(
    MINUTES.includes(initial.minute) ? initial.minute : 30,
  );
  const [draftMode, setDraftMode] = useState<TimeMode>(mode);
  const dialogRef = useRef<HTMLDivElement>(null);
  const title = field === "return" ? "Return Time" : "Outbound Time";
  const modeLabel = draftMode === "arriveBy" ? "arrive by" : "departing";
  useDialog(open, onClose, dialogRef);

  function confirm(nextHour = hour, nextMinute = minute, nextMode = draftMode) {
    onConfirm(formatPlannerTime(nextHour, nextMinute), nextMode);
  }

  function departNow() {
    const now = nearestFiveMinutes(new Date());
    setHour(now.hour);
    setMinute(now.minute);
    confirm(now.hour, now.minute, "departing");
  }

  return (
    <div
      className={`date-overlay time-overlay${open ? " date-overlay-open" : ""}`}
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
        className={`date-sheet${open ? " date-sheet-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-dialog-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="time-sheet-body">
          <div className="time-sheet-content">
            <div className="sheet-modal-header">
              <div className="sheet-modal-grabber" aria-hidden="true" />
              <h2 className="date-sheet-title" id="time-dialog-title">
                {title}
              </h2>
            </div>
            <div className="date-sheet-rule" />
            <div
              className="time-mode"
              role="radiogroup"
              aria-label="Time mode"
            >
              <button
                type="button"
                role="radio"
                aria-checked={draftMode === "departing"}
                className={`time-mode-option${
                  draftMode === "departing" ? " time-mode-option-active" : ""
                }`}
                onClick={() => setDraftMode("departing")}
              >
                Departing
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={draftMode === "arriveBy"}
                className={`time-mode-option${
                  draftMode === "arriveBy" ? " time-mode-option-active" : ""
                }`}
                onClick={() => setDraftMode("arriveBy")}
              >
                Arrive By
              </button>
            </div>
          </div>
          <div className="time-wheels">
            <WheelColumn
              values={HOURS}
              selected={hour}
              onSelect={setHour}
              label="Hours"
              unit="hours"
            />
            <p className="time-colon" aria-hidden="true">
              :
            </p>
            <WheelColumn
              values={MINUTES}
              selected={minute}
              onSelect={setMinute}
              label="Minutes"
              unit="minutes"
            />
          </div>
          <div className="date-sheet-actions">
            <button
              type="button"
              className="date-confirm"
              aria-label={`Confirm ${formatPlannerTime(hour, minute)}, ${modeLabel}`}
              onClick={() => confirm()}
            >
              Confirm
            </button>
            <button type="button" className="date-today" onClick={departNow}>
              Depart Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
