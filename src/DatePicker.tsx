import { useMemo, useRef, useState } from "react";
import chevron from "./assets/chevron.svg";
import dateSelected from "./assets/date-selected.svg";
import type { TimeMode } from "./TimePicker";
import { useDialog } from "./useDialog";

export type DateField = "outbound" | "return" | "start";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type DatePickerProps = {
  open: boolean;
  field: DateField;
  selectedDate: Date;
  time: string;
  timeMode: TimeMode;
  onConfirm: (date: Date) => void;
  onOpenTimePicker: () => void;
  onClose: () => void;
  onExited: () => void;
  inert?: boolean;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number) {
  return startOfDay(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() + days),
  );
}

function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function isAfterDay(a: Date, b: Date) {
  return startOfDay(a).getTime() > startOfDay(b).getTime();
}

function clampDate(date: Date, min: Date, max: Date) {
  const day = startOfDay(date);
  if (isBeforeDay(day, min)) {
    return min;
  }
  if (isAfterDay(day, max)) {
    return max;
  }
  return day;
}

function getWeeks(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  while (cells.length < 35) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <div className={className ?? "chevron"}>
      <img src={chevron} alt="" width={9} height={18} />
    </div>
  );
}

function formatAccessibleDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DatePicker({
  open,
  field,
  selectedDate,
  time,
  timeMode,
  onConfirm,
  onOpenTimePicker,
  onClose,
  onExited,
  inert = false,
}: DatePickerProps) {
  const today = startOfDay(new Date());
  const minDate = today;
  const maxDate = addDays(today, 12 * 7);
  const [viewYear, setViewYear] = useState(() => {
    const initial = clampDate(selectedDate, minDate, maxDate);
    return initial.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const initial = clampDate(selectedDate, minDate, maxDate);
    return initial.getMonth();
  });
  const [draft, setDraft] = useState(() =>
    clampDate(selectedDate, minDate, maxDate),
  );
  const weeks = useMemo(() => getWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const viewMonthStart = new Date(viewYear, viewMonth, 1);
  const nextMonthStart = new Date(viewYear, viewMonth + 1, 1);
  const canGoPrev = viewMonthStart.getTime() > minMonth.getTime();
  const canGoNext = !isAfterDay(nextMonthStart, maxDate);
  const showTime = field !== "start";
  const dialogRef = useRef<HTMLDivElement>(null);
  const title =
    field === "return"
      ? "Return Date"
      : field === "start"
        ? "Start Date"
        : "Outbound Date";
  const timeLabel = timeMode === "arriveBy" ? "Arrive By" : "Departing";
  useDialog(open, onClose, dialogRef, open && !inert);

  function shiftMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function selectToday() {
    setDraft(today);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  return (
    <div
      className={`date-overlay${open ? " date-overlay-open" : ""}`}
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
        aria-labelledby="date-dialog-title"
        aria-hidden={inert || undefined}
        inert={inert || undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="date-sheet-body">
          <div className="date-sheet-content">
            <div className="sheet-modal-header">
              <div className="sheet-modal-grabber" aria-hidden="true" />
              <h2 className="date-sheet-title" id="date-dialog-title">
                {title}
              </h2>
            </div>
            <div className="date-sheet-rule" />
            <div
              className="date-calendar"
              role="grid"
              aria-labelledby="date-month-heading"
            >
              <div className="date-calendar-header">
                <div className="date-month-year">
                  <p id="date-month-heading">
                    {MONTHS[viewMonth]} {viewYear}
                  </p>
                </div>
                <div className="date-month-arrows">
                  <button
                    type="button"
                    className="date-month-arrow"
                    aria-label={`Previous month, ${MONTHS[(viewMonth + 11) % 12]}`}
                    disabled={!canGoPrev}
                    onClick={() => shiftMonth(-1)}
                  >
                    <img src={chevron} alt="" width={9} height={18} />
                  </button>
                  <button
                    type="button"
                    className="date-month-arrow date-month-arrow-next"
                    aria-label={`Next month, ${MONTHS[(viewMonth + 1) % 12]}`}
                    disabled={!canGoNext}
                    onClick={() => shiftMonth(1)}
                  >
                    <img src={chevron} alt="" width={9} height={18} />
                  </button>
                </div>
              </div>
              <div className="date-weekday-row" role="row">
                {WEEKDAYS.map((day, index) => (
                  <div role="columnheader" key={day}>
                    <span aria-hidden="true">{day}</span>
                    <span className="visually-hidden">{WEEKDAY_NAMES[index]}</span>
                  </div>
                ))}
              </div>
              <div className="date-weeks">
                {weeks.map((week, weekIndex) => (
                  <div className="date-week" role="row" key={weekIndex}>
                    {week.map((day, dayIndex) => {
                      if (day == null) {
                        return (
                          <div
                            className="date-day"
                            role="gridcell"
                            aria-hidden="true"
                            key={`empty-${dayIndex}`}
                          />
                        );
                      }
                      const date = new Date(viewYear, viewMonth, day);
                      const selected = isSameDay(date, draft);
                      const isToday = isSameDay(date, today);
                      const disabled =
                        isBeforeDay(date, minDate) || isAfterDay(date, maxDate);
                      const dayName = formatAccessibleDate(date);
                      return (
                        <button
                          type="button"
                          role="gridcell"
                          className={`date-day${selected ? " date-day-selected" : ""}${
                            isToday && !selected ? " date-day-today" : ""
                          }${disabled ? " date-day-disabled" : ""}`}
                          key={day}
                          disabled={disabled}
                          aria-selected={selected}
                          aria-current={isToday ? "date" : undefined}
                          aria-label={`${dayName}${
                            isToday ? ", today" : ""
                          }${disabled ? ", unavailable" : ""}`}
                          onClick={() => setDraft(date)}
                        >
                          {selected ? (
                            <img
                              className="date-day-ring"
                              src={dateSelected}
                              alt=""
                              width={44}
                              height={44}
                            />
                          ) : null}
                          <span aria-hidden="true">{day}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="date-sheet-actions">
            {showTime ? (
              <div className="date-departing">
                <p className="date-departing-label">
                  {timeLabel}
                </p>
                <button
                  type="button"
                  className="micro-button"
                  aria-label={`${timeLabel} ${time}`}
                  aria-haspopup="dialog"
                  onClick={onOpenTimePicker}
                >
                  <p aria-hidden="true">{time}</p>
                  <ChevronIcon />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="date-confirm"
              aria-label={`Confirm ${formatAccessibleDate(draft)}`}
              onClick={() => onConfirm(draft)}
            >
              Confirm
            </button>
            <button type="button" className="date-today" onClick={selectToday}>
              Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function formatPlannerDate(date: Date) {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}
