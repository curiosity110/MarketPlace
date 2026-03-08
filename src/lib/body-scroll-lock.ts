let activeLocks = 0;
let previousOverflow = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") {
    return;
  }

  if (activeLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  activeLocks += 1;
}

export function unlockBodyScroll() {
  if (typeof document === "undefined" || activeLocks === 0) {
    return;
  }

  activeLocks -= 1;

  if (activeLocks === 0) {
    document.body.style.overflow = previousOverflow;
  }
}
