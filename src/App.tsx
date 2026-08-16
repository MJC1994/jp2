import { useState } from "react";
import chevron from "./assets/chevron.svg";
import homeOutline from "./assets/home-outline.svg";
import iconFavourite from "./assets/icon-favourite.svg";
import iconReturnActive from "./assets/icon-return-active.svg";
import iconReturnInactive from "./assets/icon-return-inactive.svg";
import iconSeason from "./assets/icon-season.svg";
import iconSeasonActive from "./assets/icon-season-active.svg";
import iconSingle from "./assets/icon-single.svg";
import iconSingleInactive from "./assets/icon-single-inactive.svg";
import liveOval from "./assets/live-oval.svg";
import liveRect from "./assets/live-rect.svg";
import liveUnion from "./assets/live-union.svg";
import menuOutline from "./assets/menu-outline-2.svg";
import planBuyFill from "./assets/plan-buy-fill.svg";
import plusH from "./assets/plus-h.svg";
import plusV from "./assets/plus-v.svg";
import shoppingBasket from "./assets/shopping-basket.svg";
import swapArrows from "./assets/swap-arrows.svg";
import swapBg from "./assets/swap-bg.svg";
import tabActiveLine from "./assets/tab-active-line.svg";
import tabTopLine from "./assets/tab-top-line.svg";
import ticketOutline from "./assets/ticket-outline.svg";
import { DatePicker, formatPlannerDate, type DateField } from "./DatePicker";
import {
  emptyRailcards,
  formatRailcards,
  railcardTotal,
  RailcardPicker,
  RailcardSwatch,
  selectedRailcards,
  type RailcardCounts,
} from "./RailcardPicker";
import {
  formatPassengers,
  PassengerPicker,
} from "./PassengerPicker";
import { StationPicker, type StationChoice, type StationField, type ViaMode } from "./StationPicker";
import { StatusBar } from "./StatusBar";
import { TimePicker, type TimeField, type TimeMode } from "./TimePicker";

type TicketType = "single" | "return" | "season" | "favourites";

type TripPlannerFieldsProps = {
  fromStation: string;
  toStation: string;
  viaStation: string;
  viaMode: ViaMode;
  onOpenStationPicker: (field: StationField) => void;
  onSwapStations: () => void;
  onClearVia: () => void;
};

type TripPlannerProps = TripPlannerFieldsProps & {
  ticketType: TicketType;
  outboundDate: Date;
  returnDate: Date;
  outboundTime: string;
  returnTime: string;
  onSelectTicketType: (type: TicketType) => void;
  onOpenDatePicker: (field: DateField) => void;
  onOpenTimePicker: (field: TimeField) => void;
  onOpenPassengerPicker: () => void;
  onOpenRailcardPicker: () => void;
  passengerLabel: string;
  passengerCount: number;
  railcards: RailcardCounts;
};

function TitleBar() {
  return (
    <div className="title-bar">
      <h1>Plan & buy tickets</h1>
      <button type="button" className="basket" aria-label="Basket, £0">
        <div className="basket-icon">
          <img className="icon-fill" src={shoppingBasket} alt="" />
        </div>
        <p className="basket-value">£0</p>
      </button>
    </div>
  );
}

function TripPlannerFields({
  fromStation,
  toStation,
  viaStation,
  viaMode,
  onOpenStationPicker,
  onSwapStations,
  onClearVia,
}: TripPlannerFieldsProps) {
  const viaLabel = viaStation
    ? `${viaMode === "avoid" ? "Avoid" : "Via"} ${viaStation}`
    : "Via / Avoid";

  return (
    <div className="trip-planner">
      <button
        type="button"
        className="station-field"
        aria-haspopup="dialog"
        aria-label={fromStation ? `Leaving from, ${fromStation}` : "Leaving from"}
        onClick={() => onOpenStationPicker("from")}
      >
        <p className={fromStation ? "station-field-value" : undefined}>
          {fromStation || "Leaving from… "}
        </p>
      </button>
      <div className="station-field-stack">
        <button
          type="button"
          className="station-field"
          aria-haspopup="dialog"
          aria-label={toStation ? `Going to, ${toStation}` : "Going to"}
          onClick={() => onOpenStationPicker("to")}
        >
          <p className={toStation ? "station-field-value" : undefined}>
            {toStation || "Going to… "}
          </p>
        </button>
        <div className="via-cta-row">
          <button
            type="button"
            className="via-cta"
            aria-haspopup="dialog"
            aria-label={viaLabel}
            onClick={() => onOpenStationPicker("via")}
          >
            {viaLabel}
          </button>
          {viaStation ? (
            <button
              type="button"
              className="via-clear"
              aria-label={`Remove ${viaLabel}`}
              onClick={onClearVia}
            >
              ×
            </button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        className="swap"
        aria-label="Swap origin and destination"
        onClick={onSwapStations}
      >
        <img className="icon-fill" src={swapBg} alt="" />
        <div className="swap-arrows">
          <img className="icon-fill" src={swapArrows} alt="" />
        </div>
      </button>
    </div>
  );
}

function TicketTypes({
  ticketType,
  onSelectTicketType,
}: {
  ticketType: TicketType;
  onSelectTicketType: (type: TicketType) => void;
}) {
  return (
    <div className="ticket-types">
      <div
        className="ticket-types-row"
        role="radiogroup"
        aria-label="Ticket type"
      >
        <button
          type="button"
          role="radio"
          aria-checked={ticketType === "single"}
          className={`ticket-tab${ticketType === "single" ? " ticket-tab-active" : ""}`}
          onClick={() => onSelectTicketType("single")}
        >
          <div className="ticket-tab-inner">
            <div className="ticket-icon ticket-icon-single">
              <img
                src={ticketType === "single" ? iconSingle : iconSingleInactive}
                alt=""
              />
            </div>
            <p className="ticket-tab-label">Single</p>
          </div>
          {ticketType === "single" ? <div className="ticket-tab-underline" /> : null}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={ticketType === "return"}
          className={`ticket-tab${ticketType === "return" ? " ticket-tab-active" : ""}`}
          onClick={() => onSelectTicketType("return")}
        >
          <div className="ticket-tab-inner">
            <div className="ticket-icon ticket-icon-return">
              <img
                src={ticketType === "return" ? iconReturnActive : iconReturnInactive}
                alt=""
              />
            </div>
            <p className="ticket-tab-label">Return</p>
          </div>
          {ticketType === "return" ? <div className="ticket-tab-underline" /> : null}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={ticketType === "season"}
          className={`ticket-tab${ticketType === "season" ? " ticket-tab-active" : ""}`}
          onClick={() => onSelectTicketType("season")}
        >
          <div className="ticket-tab-inner">
            <div className="ticket-icon ticket-icon-season">
              <img
                src={ticketType === "season" ? iconSeasonActive : iconSeason}
                alt=""
              />
            </div>
            <p className="ticket-tab-label">Season & Flexi</p>
          </div>
          {ticketType === "season" ? <div className="ticket-tab-underline" /> : null}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={ticketType === "favourites"}
          className={`ticket-tab${ticketType === "favourites" ? " ticket-tab-active" : ""}`}
          onClick={() => onSelectTicketType("favourites")}
        >
          <div className="ticket-tab-inner">
            <div className="ticket-icon ticket-icon-fav">
              <img src={iconFavourite} alt="" />
            </div>
            <p className="ticket-tab-label">Favourites</p>
          </div>
          {ticketType === "favourites" ? (
            <div className="ticket-tab-underline" />
          ) : null}
        </button>
      </div>
      <div className="ticket-types-divider" />
    </div>
  );
}

function Chevron() {
  return (
    <div className="chevron">
      <img src={chevron} alt="" />
    </div>
  );
}

function SearchCard({
  ticketType,
  outboundDate,
  returnDate,
  outboundTime,
  returnTime,
  onOpenDatePicker,
  onOpenTimePicker,
  onOpenPassengerPicker,
  onOpenRailcardPicker,
  passengerLabel,
  passengerCount,
  railcards,
}: {
  ticketType: TicketType;
  outboundDate: Date;
  returnDate: Date;
  outboundTime: string;
  returnTime: string;
  onOpenDatePicker: (field: DateField) => void;
  onOpenTimePicker: (field: TimeField) => void;
  onOpenPassengerPicker: () => void;
  onOpenRailcardPicker: () => void;
  passengerLabel: string;
  passengerCount: number;
  railcards: RailcardCounts;
}) {
  const isReturn = ticketType === "return";
  const isSeason = ticketType === "season";
  const selectedCards = selectedRailcards(railcards);
  const railcardLabel = formatRailcards(railcards);
  const tooManyRailcards = railcardTotal(railcards) > passengerCount;

  return (
    <div className="search-card">
      {isSeason ? (
        <div className="picker">
          <p className="picker-label">Start Date</p>
          <button
            type="button"
            className="micro-button"
            aria-haspopup="dialog"
            aria-label={`Start date, ${formatPlannerDate(outboundDate)}`}
            onClick={() => onOpenDatePicker("start")}
          >
            <p>{formatPlannerDate(outboundDate)}</p>
            <Chevron />
          </button>
        </div>
      ) : (
        <div className="picker">
          <p className="picker-label">Outbound</p>
          <button
            type="button"
            className="micro-button"
            aria-haspopup="dialog"
            aria-label={`Outbound date, ${formatPlannerDate(outboundDate)}`}
            onClick={() => onOpenDatePicker("outbound")}
          >
            <p>{formatPlannerDate(outboundDate)}</p>
            <Chevron />
          </button>
          <button
            type="button"
            className="micro-button"
            aria-haspopup="dialog"
            aria-label={`Outbound time, ${outboundTime}`}
            onClick={() => onOpenTimePicker("outbound")}
          >
            <p>{outboundTime}</p>
            <Chevron />
          </button>
        </div>
      )}
      {isReturn ? (
        <div className="picker">
          <p className="picker-label">Return</p>
          <button
            type="button"
            className="micro-button"
            aria-haspopup="dialog"
            aria-label={`Return date, ${formatPlannerDate(returnDate)}`}
            onClick={() => onOpenDatePicker("return")}
          >
            <p>{formatPlannerDate(returnDate)}</p>
            <Chevron />
          </button>
          <button
            type="button"
            className="micro-button"
            aria-haspopup="dialog"
            aria-label={`Return time, ${returnTime}`}
            onClick={() => onOpenTimePicker("return")}
          >
            <p>{returnTime}</p>
            <Chevron />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="picker picker-row"
        aria-haspopup="dialog"
        aria-label={`Passengers, ${passengerLabel}`}
        onClick={onOpenPassengerPicker}
      >
        <p className="picker-label">Passengers</p>
        <div className="micro-value">
          <p>{passengerLabel}</p>
          <Chevron />
        </div>
      </button>
      <div className="railcard-cta">
        <button
          type="button"
          className={`picker picker-row${
            selectedCards.length > 0 ? " picker-row-railcards" : ""
          }${tooManyRailcards ? " picker-row-error" : ""}`}
          aria-haspopup="dialog"
          aria-invalid={tooManyRailcards}
          aria-describedby={
            tooManyRailcards ? "railcard-passenger-error" : undefined
          }
          aria-label={
            railcardLabel ? `Railcard, ${railcardLabel}` : "Add railcard"
          }
          onClick={onOpenRailcardPicker}
        >
          <div className="railcard-cta-header">
            <p className="picker-label">Railcard</p>
            {selectedCards.length > 0 ? (
              <Chevron />
            ) : (
              <div className="plus">
                <img className="plus-v" src={plusV} alt="" />
                <img className="plus-h" src={plusH} alt="" />
              </div>
            )}
          </div>
          {selectedCards.map((card) => (
            <div className="railcard-line" key={card.name}>
              <RailcardSwatch name={card.name} />
              <p className="railcard-line-name">{card.name}</p>
              {card.count > 1 ? (
                <p className="railcard-line-count">{card.count}</p>
              ) : null}
            </div>
          ))}
        </button>
        {tooManyRailcards ? (
          <p
            className="picker-field-error-text"
            id="railcard-passenger-error"
            role="alert"
          >
            You cannot have more railcards than passengers
          </p>
        ) : null}
      </div>
      <div className="search-actions">
        <button type="button" className="find-button">
          Find times & tickets
        </button>
        <p className="no-fees">No booking fees! </p>
      </div>
    </div>
  );
}

function LiveIcon() {
  return (
    <div className="tab-item-icon tab-live-icon">
      <img className="live-union" src={liveUnion} alt="" />
      <img className="live-window" src={liveRect} alt="" />
      <img className="live-light-l" src={liveOval} alt="" />
      <img className="live-light-r" src={liveOval} alt="" />
    </div>
  );
}

function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Main">
      <div className="tab-bar-top-line">
        <img className="icon-fill" src={tabTopLine} alt="" />
      </div>
      <div className="tab-bar-items">
        <button type="button" className="tab-item">
          <div className="tab-item-icon tab-home-icon">
            <img className="icon-fill" src={homeOutline} alt="" />
          </div>
          <p className="tab-label">Home</p>
        </button>
        <button
          type="button"
          className="tab-item tab-item-active"
          aria-current="page"
        >
          <div className="tab-active-line">
            <img className="icon-fill" src={tabActiveLine} alt="" />
          </div>
          <div className="tab-item-icon tab-plan-icon">
            <img className="icon-fill" src={planBuyFill} alt="" />
          </div>
          <p className="tab-label">Plan & Buy</p>
        </button>
        <button type="button" className="tab-item">
          <LiveIcon />
          <p className="tab-label">Live</p>
        </button>
        <button type="button" className="tab-item">
          <div className="tab-item-icon tab-tickets-icon">
            <img className="icon-fill" src={ticketOutline} alt="" />
          </div>
          <p className="tab-label">My Tickets</p>
        </button>
        <button type="button" className="tab-item">
          <div className="tab-item-icon tab-menu-icon">
            <img className="icon-fill" src={menuOutline} alt="" />
          </div>
          <p className="tab-label">Menu</p>
        </button>
      </div>
    </nav>
  );
}

function HomeIndicator() {
  return (
    <div className="home-indicator">
      <div className="home-indicator-pill" />
    </div>
  );
}

function TripPlanner({
  fromStation,
  toStation,
  viaStation,
  viaMode,
  ticketType,
  outboundDate,
  returnDate,
  outboundTime,
  returnTime,
  onOpenStationPicker,
  onSwapStations,
  onClearVia,
  onSelectTicketType,
  onOpenDatePicker,
  onOpenTimePicker,
  onOpenPassengerPicker,
  onOpenRailcardPicker,
  passengerLabel,
  passengerCount,
  railcards,
}: TripPlannerProps) {
  return (
    <>
      <StatusBar variant="dark" />
      <TitleBar />
      <TripPlannerFields
        fromStation={fromStation}
        toStation={toStation}
        viaStation={viaStation}
        viaMode={viaMode}
        onOpenStationPicker={onOpenStationPicker}
        onSwapStations={onSwapStations}
        onClearVia={onClearVia}
      />
      <TicketTypes
        ticketType={ticketType}
        onSelectTicketType={onSelectTicketType}
      />
      <SearchCard
        ticketType={ticketType}
        outboundDate={outboundDate}
        returnDate={returnDate}
        outboundTime={outboundTime}
        returnTime={returnTime}
        onOpenDatePicker={onOpenDatePicker}
        onOpenTimePicker={onOpenTimePicker}
        onOpenPassengerPicker={onOpenPassengerPicker}
        onOpenRailcardPicker={onOpenRailcardPicker}
        passengerLabel={passengerLabel}
        passengerCount={passengerCount}
        railcards={railcards}
      />
      <TabBar />
      <HomeIndicator />
    </>
  );
}

export default function App() {
  const [activeField, setActiveField] = useState<StationField>("from");
  const [fromStation, setFromStation] = useState("");
  const [toStation, setToStation] = useState("");
  const [viaStation, setViaStation] = useState("");
  const [viaMode, setViaMode] = useState<ViaMode>("via");
  const [homeStation, setHomeStation] = useState<StationChoice | null>(null);
  const [workStation, setWorkStation] = useState<StationChoice | null>(null);
  const [pickerRendered, setPickerRendered] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const [ticketType, setTicketType] = useState<TicketType>("single");
  const [outboundDate, setOutboundDate] = useState(() => new Date());
  const [returnDate, setReturnDate] = useState(() => new Date());
  const [outboundTime, setOutboundTime] = useState("11:30");
  const [returnTime, setReturnTime] = useState("11:30");
  const [outboundTimeMode, setOutboundTimeMode] =
    useState<TimeMode>("departing");
  const [returnTimeMode, setReturnTimeMode] = useState<TimeMode>("departing");
  const [dateField, setDateField] = useState<DateField>("outbound");
  const [datePickerRendered, setDatePickerRendered] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [datePickerSession, setDatePickerSession] = useState(0);
  const [timeField, setTimeField] = useState<TimeField>("outbound");
  const [timePickerRendered, setTimePickerRendered] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerSession, setTimePickerSession] = useState(0);
  const [adults, setAdults] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [railcards, setRailcards] = useState<RailcardCounts>(emptyRailcards);
  const [passengerPickerRendered, setPassengerPickerRendered] = useState(false);
  const [passengerPickerOpen, setPassengerPickerOpen] = useState(false);
  const [passengerPickerSession, setPassengerPickerSession] = useState(0);
  const [railcardPickerRendered, setRailcardPickerRendered] = useState(false);
  const [railcardPickerOpen, setRailcardPickerOpen] = useState(false);
  const [railcardPickerSession, setRailcardPickerSession] = useState(0);

  function openStationPicker(field: StationField) {
    setActiveField(field);
    setPickerSession((session) => session + 1);
    setPickerRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPickerOpen(true));
    });
  }

  function closeStationPicker() {
    setPickerOpen(false);
  }

  function openDatePicker(field: DateField) {
    setDateField(field);
    setDatePickerSession((session) => session + 1);
    setDatePickerRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDatePickerOpen(true));
    });
  }

  function closeDatePicker() {
    setDatePickerOpen(false);
  }

  function confirmDate(date: Date) {
    if (dateField === "return") {
      setReturnDate(date);
    } else {
      setOutboundDate(date);
    }
    closeDatePicker();
  }

  function openTimePicker(field: TimeField) {
    setTimeField(field);
    setTimePickerSession((session) => session + 1);
    setTimePickerRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTimePickerOpen(true));
    });
  }

  function closeTimePicker() {
    setTimePickerOpen(false);
  }

  function openPassengerPicker() {
    setPassengerPickerSession((session) => session + 1);
    setPassengerPickerRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPassengerPickerOpen(true));
    });
  }

  function closePassengerPicker() {
    setPassengerPickerOpen(false);
  }

  function confirmPassengers(nextAdults: number, nextChildren: number) {
    setAdults(nextAdults);
    setChildrenCount(nextChildren);
    closePassengerPicker();
  }

  function openRailcardPicker() {
    setRailcardPickerSession((session) => session + 1);
    setRailcardPickerRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRailcardPickerOpen(true));
    });
  }

  function closeRailcardPicker() {
    setRailcardPickerOpen(false);
  }

  function confirmRailcards(counts: RailcardCounts) {
    setRailcards(counts);
    closeRailcardPicker();
  }

  function confirmTime(time: string, mode: TimeMode) {
    if (timeField === "return") {
      setReturnTime(time);
      setReturnTimeMode(mode);
    } else {
      setOutboundTime(time);
      setOutboundTimeMode(mode);
    }
    closeTimePicker();
  }

  function swapStations() {
    setFromStation(toStation);
    setToStation(fromStation);
  }

  return (
    <div className="phone">
      <div
        aria-hidden={
          pickerRendered ||
          datePickerRendered ||
          timePickerRendered ||
          passengerPickerRendered ||
          railcardPickerRendered ||
          undefined
        }
      >
        <TripPlanner
        fromStation={fromStation}
        toStation={toStation}
        viaStation={viaStation}
        viaMode={viaMode}
        ticketType={ticketType}
        outboundDate={outboundDate}
        returnDate={returnDate}
        outboundTime={outboundTime}
        returnTime={returnTime}
        onOpenStationPicker={openStationPicker}
        onSwapStations={swapStations}
        onClearVia={() => setViaStation("")}
        onSelectTicketType={setTicketType}
        onOpenDatePicker={openDatePicker}
        onOpenTimePicker={openTimePicker}
        onOpenPassengerPicker={openPassengerPicker}
        onOpenRailcardPicker={openRailcardPicker}
        passengerLabel={formatPassengers(adults, childrenCount)}
        passengerCount={adults + childrenCount}
        railcards={railcards}
      />
      </div>
      {datePickerRendered ? (
        <DatePicker
          key={datePickerSession}
          open={datePickerOpen}
          field={dateField}
          selectedDate={dateField === "return" ? returnDate : outboundDate}
          time={dateField === "return" ? returnTime : outboundTime}
          timeMode={dateField === "return" ? returnTimeMode : outboundTimeMode}
          onConfirm={confirmDate}
          onOpenTimePicker={() =>
            openTimePicker(dateField === "return" ? "return" : "outbound")
          }
          onClose={closeDatePicker}
          onExited={() => setDatePickerRendered(false)}
          inert={timePickerOpen}
        />
      ) : null}
      {timePickerRendered ? (
        <TimePicker
          key={timePickerSession}
          open={timePickerOpen}
          field={timeField}
          time={timeField === "return" ? returnTime : outboundTime}
          mode={timeField === "return" ? returnTimeMode : outboundTimeMode}
          onConfirm={confirmTime}
          onClose={closeTimePicker}
          onExited={() => setTimePickerRendered(false)}
        />
      ) : null}
      {passengerPickerRendered ? (
        <PassengerPicker
          key={passengerPickerSession}
          open={passengerPickerOpen}
          adults={adults}
          children={childrenCount}
          onConfirm={confirmPassengers}
          onClose={closePassengerPicker}
          onExited={() => setPassengerPickerRendered(false)}
        />
      ) : null}
      {railcardPickerRendered ? (
        <RailcardPicker
          key={railcardPickerSession}
          open={railcardPickerOpen}
          counts={railcards}
          onConfirm={confirmRailcards}
          onClose={closeRailcardPicker}
          onExited={() => setRailcardPickerRendered(false)}
        />
      ) : null}
      {pickerRendered ? (
        <StationPicker
          key={pickerSession}
          open={pickerOpen}
          activeField={activeField}
          fromStation={fromStation}
          toStation={toStation}
          viaStation={viaStation}
          viaMode={viaMode}
          homeStation={homeStation}
          workStation={workStation}
          onSelectFrom={(station) => setFromStation(station.name)}
          onSelectTo={(station) => setToStation(station.name)}
          onSelectVia={(station, mode) => {
            setViaStation(station.name);
            setViaMode(mode);
          }}
          onSetHome={setHomeStation}
          onSetWork={setWorkStation}
          onDone={closeStationPicker}
          onExited={() => setPickerRendered(false)}
        />
      ) : null}
    </div>
  );
}
