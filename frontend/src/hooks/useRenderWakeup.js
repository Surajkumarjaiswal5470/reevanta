import { useEffect, useState } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const HEALTH_URL = `${BACKEND_URL}/api/health`;

export function useRenderWakeup() {
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let timer = setTimeout(() => {
      // If health ping takes longer than 2.5s, server is sleeping/spinning up on Render free tier
      if (!isReady) {
        setIsWakingUp(true);
      }
    }, 2500);

    const prewarmServer = async () => {
      try {
        const res = await fetch(HEALTH_URL, { cache: "no-store" });
        if (res.ok) {
          setIsReady(true);
          setIsWakingUp(false);
        }
      } catch (err) {
        console.warn("Render prewarm ping warning:", err);
      } finally {
        clearTimeout(timer);
      }
    };

    prewarmServer();

    return () => clearTimeout(timer);
  }, []);

  return { isWakingUp, isReady };
}
