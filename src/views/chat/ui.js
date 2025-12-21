export function lockBodyScroll() {
  if (typeof window === "undefined") return null;
  const body = document.body;
  const docEl = document.documentElement;
  if (!body || !docEl) return null;
  if (body.dataset.chatScrollLocked === "1") return null;

  const scrollY = window.scrollY || docEl.scrollTop || 0;
  const previous = {
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyLeft: body.style.left,
    bodyRight: body.style.right,
    bodyWidth: body.style.width,
    bodyOverflow: body.style.overflow,
    docOverflow: docEl.style.overflow,
  };

  body.dataset.chatScrollLocked = "1";
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  docEl.style.overflow = "hidden";

  return () => {
    delete body.dataset.chatScrollLocked;
    body.style.position = previous.bodyPosition;
    body.style.top = previous.bodyTop;
    body.style.left = previous.bodyLeft;
    body.style.right = previous.bodyRight;
    body.style.width = previous.bodyWidth;
    body.style.overflow = previous.bodyOverflow;
    docEl.style.overflow = previous.docOverflow;
    window.scrollTo(0, scrollY);
  };
}

export function startNavHeightTracking(navHeightRef) {
  function updateNavHeight() {
    const navigation = document.querySelector(".navigation");
    if (!navigation) return;
    navHeightRef.value = Math.max(0, Math.round(navigation.getBoundingClientRect().height));
  }

  updateNavHeight();
  window.addEventListener("resize", updateNavHeight);

  const navigation = document.querySelector(".navigation");
  let navResizeObserver;
  if (navigation && typeof ResizeObserver !== "undefined") {
    navResizeObserver = new ResizeObserver(updateNavHeight);
    navResizeObserver.observe(navigation);
  }

  return () => {
    window.removeEventListener("resize", updateNavHeight);
    navResizeObserver?.disconnect();
  };
}
