const HUD = () => (
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
        🧟 CLAWBIE APOCALYPSE
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>STA</span>
        <div
          style={{
            width: 120,
            height: 12,
            background: "#333",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              width: "72%",
              height: "100%",
              background: "#4caf50",
              borderRadius: 6,
            }}
          />
        </div>
      </div>
      <span>🍖 3</span>
      <span>🔫 1</span>
    </div>

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
