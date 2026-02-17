interface HUDProps {
  running: boolean;
  dead: boolean;
  stamina: number;
  maxStamina: number;
  onToggle: () => void;
}

const HUD = ({ running, dead, stamina, maxStamina, onToggle }: HUDProps) => (
  <>
    {/* Top bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 48,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 24,
        zIndex: 10,
        color: "#fff",
        fontFamily: "monospace",
      }}
    >
      <span style={{ fontSize: 18, fontWeight: "bold", letterSpacing: 1 }}>
        CLAWBIE APOCALYPSE
      </span>
      <button
        onClick={onToggle}
        style={{
          padding: "4px 16px",
          fontSize: 14,
          fontFamily: "monospace",
          background: running ? "#ef5350" : "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer",
        }}
      >
        {running ? "STOP" : "START"}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12 }}>STAMINA</span>
        <div
          style={{
            width: 120,
            height: 14,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(stamina / maxStamina) * 100}%`,
              height: "100%",
              background: stamina < 20 ? "#ef5350" : "#4caf50",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <span style={{ fontSize: 12, minWidth: 32 }}>
          {Math.floor(stamina)}
        </span>
      </div>
      <span style={{ fontSize: 14 }}>Right-click to move</span>
    </div>

    {/* Death overlay */}
    {dead && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 64,
            fontWeight: "bold",
            fontFamily: "monospace",
            color: "#ef5350",
          }}
        >
          YOU DIED
        </span>
      </div>
    )}

    {/* Minimap placeholder */}
    <div
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        width: 160,
        height: 160,
        background: "rgba(0,0,0,0.6)",
        border: "2px solid #555",
        borderRadius: 4,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#888",
        fontSize: 12,
        fontFamily: "monospace",
      }}
    >
      MINIMAP
    </div>
  </>
);

export default HUD;
