"use client";
import { useEffect, useState } from "react";

const KEY = "mm_session_id";
const NAME_KEY = "mm_player_name";

export function useSession() {
  const [sessionId, setSessionId] = useState<string>("");
  const [name, setNameState] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    setSessionId(id);
    const n = localStorage.getItem(NAME_KEY) || "";
    setNameState(n);
  }, []);

  function setName(n: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(NAME_KEY, n);
    setNameState(n);
  }

  return { sessionId, name, setName };
}
