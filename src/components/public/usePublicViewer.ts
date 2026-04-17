"use client";

import { useEffect, useState } from "react";

export type PublicViewerState = {
  isAuthenticated: boolean;
  cartCount: number;
  wishlistCount: number;
};

type PublicViewerResponse = PublicViewerState & {
  ok?: boolean;
  error?: string;
};

const DEFAULT_PUBLIC_VIEWER_STATE: PublicViewerState = {
  isAuthenticated: false,
  cartCount: 0,
  wishlistCount: 0,
};

let cachedViewerState: PublicViewerState | null = null;
let pendingViewerRequest: Promise<PublicViewerState> | null = null;
const viewerSubscribers = new Set<(state: PublicViewerState) => void>();

function normalizeViewerState(
  state?: Partial<PublicViewerState> | null,
): PublicViewerState {
  return {
    isAuthenticated: Boolean(state?.isAuthenticated),
    cartCount:
      typeof state?.cartCount === "number" && Number.isFinite(state.cartCount)
        ? state.cartCount
        : 0,
    wishlistCount:
      typeof state?.wishlistCount === "number" &&
      Number.isFinite(state.wishlistCount)
        ? state.wishlistCount
        : 0,
  };
}

function publishViewerState(state: PublicViewerState) {
  cachedViewerState = state;

  for (const subscriber of viewerSubscribers) {
    subscriber(state);
  }
}

async function fetchPublicViewerState() {
  try {
    const response = await fetch("/api/public/viewer", {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | PublicViewerResponse
      | null;

    if (!response.ok || !payload?.ok) {
      return DEFAULT_PUBLIC_VIEWER_STATE;
    }

    return normalizeViewerState(payload);
  } catch {
    return DEFAULT_PUBLIC_VIEWER_STATE;
  }
}

function ensureViewerRequest() {
  if (cachedViewerState) {
    return Promise.resolve(cachedViewerState);
  }

  if (!pendingViewerRequest) {
    pendingViewerRequest = fetchPublicViewerState()
      .then((state) => {
        publishViewerState(state);
        return state;
      })
      .finally(() => {
        pendingViewerRequest = null;
      });
  }

  return pendingViewerRequest;
}

export function refreshPublicViewer() {
  if (pendingViewerRequest) {
    return pendingViewerRequest;
  }

  pendingViewerRequest = fetchPublicViewerState()
    .then((state) => {
      publishViewerState(state);
      return state;
    })
    .finally(() => {
      pendingViewerRequest = null;
    });

  return pendingViewerRequest;
}

export function usePublicViewer(initialState?: Partial<PublicViewerState>) {
  const [state, setState] = useState<PublicViewerState>(() =>
    normalizeViewerState(initialState),
  );
  const [resolved, setResolved] = useState(Boolean(cachedViewerState));

  useEffect(() => {
    viewerSubscribers.add(setState);

    if (cachedViewerState) {
      setState(cachedViewerState);
      setResolved(true);
      void refreshPublicViewer().then((nextState) => {
        setState(nextState);
        setResolved(true);
      });
    } else {
      void ensureViewerRequest().then((nextState) => {
        setState(nextState);
        setResolved(true);
      });
    }

    return () => {
      viewerSubscribers.delete(setState);
    };
  }, []);

  return {
    ...state,
    resolved,
  };
}
