import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSession,
  isSupabaseConfigured,
  loginWithGoogle as svcLoginGoogle,
  loginWithTwitter as svcLoginTwitter,
  logout as svcLogout,
  onAuthStateChange,
} from "../services/authService.js";
import { migrateGuestStorageToUser } from "../services/moodscreenDataService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  /** After first session read — never blocks first paint long; starts false only if we need to read session */
  const [sessionReady, setSessionReady] = useState(() => !isSupabaseConfigured());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  /** Bumped after sign-in / sign-out so moodscreen layer can re-hydrate */
  const [authVersion, setAuthVersion] = useState(0);

  const bumpAuthVersion = useCallback(() => {
    setAuthVersion((v) => v + 1);
  }, []);

  const openAuthModal = useCallback(() => setAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  const loginWithGoogle = useCallback(async () => {
    return svcLoginGoogle();
  }, []);

  const loginWithTwitter = useCallback(async () => {
    return svcLoginTwitter();
  }, []);

  const logout = useCallback(async () => {
    const { error } = await svcLogout();
    setUser(null);
    bumpAuthVersion();
    return { error };
  }, [bumpAuthVersion]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSessionReady(true);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const { session } = await getSession();
      if (cancelled) return;
      setUser(session?.user ?? null);
      setSessionReady(true);
    })();

    const { unsubscribe } = onAuthStateChange(async (event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (event === "SIGNED_IN" && nextUser?.id) {
        await migrateGuestStorageToUser(nextUser.id);
        bumpAuthVersion();
      }

      if (event === "SIGNED_OUT") {
        bumpAuthVersion();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [bumpAuthVersion]);

  const value = useMemo(
    () => ({
      user,
      sessionReady,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      loginWithTwitter,
      logout,
      authVersion,
      isSupabaseConfigured: isSupabaseConfigured(),
    }),
    [
      user,
      sessionReady,
      authModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      loginWithTwitter,
      logout,
      authVersion,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
