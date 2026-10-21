"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";

const COMPLETE_EVENT = "triyantra:intro-complete";

function subscribeIntro(callback: () => void) {
  window.addEventListener(COMPLETE_EVENT, callback);
  return () => window.removeEventListener(COMPLETE_EVENT, callback);
}

function getIntroSnapshot(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.intro !== "play";
}

function getIntroServerSnapshot(): boolean {
  return false;
}

export function BrandIntro() {
  const [Animation, setAnimation] = useState<ComponentType | null>(null);
  const isSkipped = useSyncExternalStore(
    subscribeIntro,
    getIntroSnapshot,
    getIntroServerSnapshot,
  );
  const removeKeyListener = useRef(() => {});

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") return;
    let cancelled = false;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      removeKeyListener.current();
      document.documentElement.dataset.intro = "skip";
      window.dispatchEvent(new Event(COMPLETE_EVENT));
    };
    window.addEventListener("keydown", onKeyDown);
    removeKeyListener.current = () =>
      window.removeEventListener("keydown", onKeyDown);
    import("./brand-intro-animation")
      .then(({ BrandIntroAnimation }) => {
        removeKeyListener.current();
        if (!cancelled && document.documentElement.dataset.intro === "play") {
          setAnimation(() => BrandIntroAnimation);
        }
      })
      .catch(() => {
        removeKeyListener.current();
        if (cancelled) return;
        document.documentElement.dataset.intro = "skip";
        window.dispatchEvent(new Event(COMPLETE_EVENT));
      });
    return () => {
      cancelled = true;
      removeKeyListener.current();
    };
  }, []);

  if (isSkipped) return null;
  if (Animation) return <Animation />;

  return (
    <div className="brand-intro" data-media="loading">
      <div className="brand-intro__content">

      </div>
    </div>
  );
}
