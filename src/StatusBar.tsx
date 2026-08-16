import batteryEndDark from "./assets/battery-end.svg";
import batteryFillDark from "./assets/battery-fill.svg";
import batteryOutlineDark from "./assets/battery-outline.svg";
import notch from "./assets/notch.svg";
import batteryEndLight from "./assets/picker-battery-end.svg";
import batteryFillLight from "./assets/picker-battery-fill.svg";
import batteryOutlineLight from "./assets/picker-battery-outline.svg";
import signalLight from "./assets/picker-signal.svg";
import wifiLight from "./assets/picker-wifi.svg";
import signalDark from "./assets/signal.svg";
import wifiDark from "./assets/wifi.svg";

type StatusBarProps = {
  variant: "dark" | "light";
};

export function StatusBar({ variant }: StatusBarProps) {
  const dark = variant === "dark";

  return (
    <div className={`status-bar${dark ? "" : " status-bar-light"}`}>
      <div className="notch">
        <img className="icon-fill" src={notch} alt="" />
      </div>
      <p className="time">9:41</p>
      <div className="signal">
        <img className="icon-fill" src={dark ? signalDark : signalLight} alt="" />
      </div>
      <div className="wifi">
        <img className="icon-fill" src={dark ? wifiDark : wifiLight} alt="" />
      </div>
      <div className="battery">
        <div className="battery-outline">
          <img
            className="icon-fill"
            src={dark ? batteryOutlineDark : batteryOutlineLight}
            alt=""
          />
        </div>
        <div className="battery-end">
          <img
            className="icon-fill"
            src={dark ? batteryEndDark : batteryEndLight}
            alt=""
          />
        </div>
        <div className="battery-fill">
          <img
            className="icon-fill"
            src={dark ? batteryFillDark : batteryFillLight}
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
