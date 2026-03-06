// Shared visual tokens: primitives compose these class groups to keep styling ownership centralized.
export const uiTypography = {
  pageTitle: "text-xl font-semibold tracking-tight sm:text-2xl",
  sectionTitle: "text-lg font-semibold sm:text-xl",
  cardTitle: "text-base font-semibold sm:text-lg",
  body: "text-sm text-foreground",
  muted: "text-sm text-muted-foreground",
  label: "text-xs font-medium text-muted-foreground",
  eyebrow: "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
};

export const uiSpacing = {
  sectionStack: "space-y-5",
  cardPadding: "p-4 sm:p-5",
  cardHeaderPadding: "p-4 pb-3 sm:p-5 sm:pb-3",
  cardHeaderGap: "space-y-1.5",
  modalBodyPadding: "p-4 sm:p-5",
};

export const uiSurface = {
  card:
    "rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_8px_24px_-18px_rgba(15,23,42,0.35)]",
  cardSubtle: "rounded-2xl border border-border/70 bg-muted/20",
  cardStrong: "rounded-2xl border border-border/70 bg-card shadow-sm",
};

export const uiControls = {
  iconButton: "h-9 w-9 p-0",
  inputBase:
    "h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-primary/25 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15",
  textareaBase:
    "min-h-24 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-primary/25 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15",
  selectBase:
    "h-10 min-w-0 w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-xl border border-border bg-input px-3 text-sm text-foreground transition-colors duration-150 hover:border-primary/25 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50",
};

export const uiModal = {
  overlayCenter: "fixed inset-0 flex items-center justify-center p-3",
  overlayTop:
    "fixed inset-0 flex items-start justify-center overflow-y-auto p-2 pt-3 sm:p-4 sm:pt-5",
  backdrop: "absolute inset-0 bg-black/45",
  panel:
    "relative w-full rounded-2xl border border-border/70 bg-background shadow-2xl",
  header:
    "flex items-start justify-between gap-2 border-b border-border/70 px-4 py-3 sm:px-5",
  body: "p-4 sm:p-5",
  footer: "mt-4 flex flex-wrap justify-end gap-2",
};
