"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      theme="dark"
      toastOptions={{
        className: "border border-brand-gray-mid bg-brand-gray-dark text-white",
      }}
    />
  );
}
