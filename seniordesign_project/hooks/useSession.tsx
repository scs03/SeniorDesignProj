// hooks/useSession.ts
import { useEffect, useState } from "react";

type UserSession = {
  email: string;
  name: string;
  role: string;
  user_id: number;
  created_at: string;
};

export function useSession() {
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        console.log("User found in localStorage:", parsed);
      }
    } catch (e) {
      console.error("Failed to parse user:", e);
    }
  }, []);

  return user;
}
