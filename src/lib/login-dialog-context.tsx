"use client";

import { createContext, useContext, useState } from "react";

type LoginDialogContextType = {
  isOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
};

const LoginDialogContext = createContext<LoginDialogContextType | null>(null);

export function LoginDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <LoginDialogContext.Provider
      value={{
        isOpen,
        openLogin: () => setIsOpen(true),
        closeLogin: () => setIsOpen(false),
      }}
    >
      {children}
    </LoginDialogContext.Provider>
  );
}

export function useLoginDialog() {
  const ctx = useContext(LoginDialogContext);
  if (!ctx) throw new Error("useLoginDialog must be used within LoginDialogProvider");
  return ctx;
}
