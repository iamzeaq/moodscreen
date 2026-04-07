import { lazy, Suspense } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const AuthModal = lazy(() => import("./AuthModal.jsx"));

export default function AuthModalHost() {
  const { authModalOpen } = useAuth();

  if (!authModalOpen) return null;

  return (
    <Suspense fallback={null}>
      <AuthModal />
    </Suspense>
  );
}
