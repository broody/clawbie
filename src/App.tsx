import { useState, useEffect } from "react";
import GameViewport from "./components/GameViewport";
import HUD from "./components/HUD";

const MAX_STAMINA = 100;

export default function App() {
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);
  const [stamina, setStamina] = useState(MAX_STAMINA);

  // Recharge stamina: +1 every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setStamina((prev) => Math.min(prev + 1, MAX_STAMINA));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <GameViewport
        running={running}
        stamina={stamina}
        onStaminaChange={setStamina}
        onDeath={() => setDead(true)}
      />
      <HUD
        running={running}
        dead={dead}
        stamina={stamina}
        maxStamina={MAX_STAMINA}
        onToggle={() => setRunning((r) => !r)}
      />
    </div>
  );
}
