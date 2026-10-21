import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

export function startScrollEngine() {
  gsap.registerPlugin(ScrollTrigger);
  const header = document.querySelector<HTMLElement>(".site-header");
  const lenis = new Lenis({ lerp: .18, smoothWheel: true, syncTouch: false, autoToggle: true, stopInertiaOnNavigate: true, anchors: { offset: -110 }, prevent: (node) => !!node.closest('dialog, [data-lenis-prevent], textarea, select') });
  const update = () => ScrollTrigger.update();
  lenis.on("scroll", update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  let last = window.scrollY;
  let compact = last >= 120;
  let direction = "up";
  const setHeaderState = (nextCompact: boolean, nextDirection: string) => {
    if (!header) return;
    if (header.dataset.compact !== String(nextCompact))
      header.dataset.compact = String(nextCompact);
    if (header.dataset.direction !== nextDirection)
      header.dataset.direction = nextDirection;
  };
  setHeaderState(compact, direction);
  const trigger = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate(self) {
      const position = self.scroll();
      const delta = position - last;
      if (Math.abs(delta) > 2) direction = delta > 0 ? "down" : "up";
      if (position <= 50) compact = false;
      else if (position >= 120) compact = true;
      setHeaderState(compact, direction);
      last = position;
    },
  });
  const focus = () => lenis.scrollTo(window.scrollY, { immediate: true });
  document.addEventListener("focusin", focus);
  return () => {
    document.removeEventListener("focusin", focus);
    trigger.kill();
    gsap.ticker.remove(tick);
    lenis.off("scroll", update);
    lenis.destroy();
    header?.removeAttribute("data-compact");
  };
}
