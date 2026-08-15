import { useEffect, useRef, useState } from "react";

// Counts down from `seconds` and calls onExpire exactly once when it hits 0.
export default function Timer({ seconds, onExpire }) {
  const [remaining, setRemaining] = useState(seconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const low = remaining <= 60;

  return (
    <div className={`timer ${low ? "timer-low" : ""}`}>
      ⏱ {mm}:{ss}
    </div>
  );
}