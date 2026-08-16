import { useRef, useState, type ReactNode } from "react";
import modalMinus from "./assets/modal-minus.svg";
import modalPlusH from "./assets/modal-plus-h.svg";
import modalPlusV from "./assets/modal-plus-v.svg";
import { useDialog } from "./useDialog";

const MAX_PASSENGERS = 9;

type PassengerPickerProps = {
  open: boolean;
  adults: number;
  children: number;
  onConfirm: (adults: number, children: number) => void;
  onClose: () => void;
  onExited: () => void;
};

function PlusIcon() {
  return (
    <div className="passenger-stepper-icon">
      <img className="passenger-plus-v" src={modalPlusV} alt="" />
      <img className="passenger-plus-h" src={modalPlusH} alt="" />
    </div>
  );
}

function MinusIcon() {
  return (
    <div className="passenger-stepper-icon">
      <img className="passenger-minus" src={modalMinus} alt="" />
    </div>
  );
}

function StepperButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="passenger-stepper-button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function formatPassengers(adults: number, childrenCount: number) {
  const parts: string[] = [];
  if (adults > 0) {
    parts.push(`${adults} ${adults === 1 ? "Adult" : "Adults"}`);
  }
  if (childrenCount > 0) {
    parts.push(
      `${childrenCount} ${childrenCount === 1 ? "Child" : "Children"}`,
    );
  }
  return parts.join(", ") || "Add passengers";
}

export function PassengerPicker({
  open,
  adults,
  children: childrenCount,
  onConfirm,
  onClose,
  onExited,
}: PassengerPickerProps) {
  const [draftAdults, setDraftAdults] = useState(adults);
  const [draftChildren, setDraftChildren] = useState(childrenCount);
  const totalPassengers = draftAdults + draftChildren;
  const canRemoveAdult = draftAdults > 0 && totalPassengers > 1;
  const canRemoveChild = draftChildren > 0 && totalPassengers > 1;
  const canAddPassenger = totalPassengers < MAX_PASSENGERS;
  const dialogRef = useRef<HTMLDivElement>(null);
  const summary = formatPassengers(draftAdults, draftChildren);
  useDialog(open, onClose, dialogRef);

  function changeAdults(delta: number) {
    setDraftAdults((current) => {
      const next = Math.max(0, current + delta);
      if (next + draftChildren < 1 || next + draftChildren > MAX_PASSENGERS) {
        return current;
      }
      return next;
    });
  }

  function changeChildren(delta: number) {
    setDraftChildren((current) => {
      const next = Math.max(0, current + delta);
      if (draftAdults + next < 1 || draftAdults + next > MAX_PASSENGERS) {
        return current;
      }
      return next;
    });
  }

  return (
    <div
      className={`date-overlay passenger-overlay${open ? " date-overlay-open" : ""}`}
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
        aria-labelledby="passenger-dialog-title"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="passenger-sheet-body">
          <div className="sheet-modal-header">
            <div className="sheet-modal-grabber" aria-hidden="true" />
            <h2 className="date-sheet-title" id="passenger-dialog-title">
              Passengers
            </h2>
          </div>
          <p className="visually-hidden" aria-live="polite" aria-atomic="true">
            {summary}
          </p>
          <div className="passenger-rule passenger-rule-narrow" />

          <div className="passenger-row">
            <div className="passenger-copy">
              <p className="passenger-name">Adult</p>
              <p className="passenger-age">16+</p>
            </div>
            {draftAdults === 0 ? (
              <StepperButton
                label="Add adult"
                disabled={!canAddPassenger}
                onClick={() => changeAdults(1)}
              >
                <PlusIcon />
              </StepperButton>
            ) : (
              <div className="passenger-stepper">
                <StepperButton
                label={
                  canRemoveAdult
                    ? "Remove adult"
                    : "Remove adult, at least one passenger required"
                }
                disabled={!canRemoveAdult}
                  onClick={() => changeAdults(-1)}
                >
                  <MinusIcon />
                </StepperButton>
                <p className="passenger-count" aria-live="off">
                  {draftAdults}
                </p>
                <StepperButton
                  label="Add adult"
                  disabled={!canAddPassenger}
                  onClick={() => changeAdults(1)}
                >
                  <PlusIcon />
                </StepperButton>
              </div>
            )}
          </div>

          <div className="passenger-rule" />

          <div className="passenger-child-block">
            <div className="passenger-row">
              <div className="passenger-copy">
                <p className="passenger-name">Child</p>
                <p className="passenger-age">5-15</p>
              </div>
              {draftChildren === 0 ? (
                <StepperButton
                  label="Add child"
                  disabled={!canAddPassenger}
                  onClick={() => changeChildren(1)}
                >
                  <PlusIcon />
                </StepperButton>
              ) : (
                <div className="passenger-stepper">
                  <StepperButton
                    label={
                      canRemoveChild
                        ? "Remove child"
                        : "Remove child, at least one passenger required"
                    }
                    disabled={!canRemoveChild}
                    onClick={() => changeChildren(-1)}
                  >
                    <MinusIcon />
                  </StepperButton>
                  <p className="passenger-count" aria-live="off">
                    {draftChildren}
                  </p>
                  <StepperButton
                    label="Add child"
                    disabled={!canAddPassenger}
                    onClick={() => changeChildren(1)}
                  >
                    <PlusIcon />
                  </StepperButton>
                </div>
              )}
            </div>
            <p className="passenger-hint">Children under 5 travel free</p>
          </div>

          <div className="passenger-rule" />

          <div className="passenger-actions">
            <button
              type="button"
              className="date-confirm"
              aria-label={`Confirm ${summary}`}
              onClick={() => onConfirm(draftAdults, draftChildren)}
            >
              Confirm
            </button>
            <button type="button" className="date-today" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
