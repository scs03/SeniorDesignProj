"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useSession();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true); // Make sure we are on client
  }, []);

  useEffect(() => {
    console.log("Checking user session:", user);
    if (hydrated && !user) {
      router.replace("/auth/signin");
    }
  }, [hydrated, user]);

  // 👇 Don't render anything until hydration complete
  if (!hydrated) return null;

  return <>{children}</>;
}
