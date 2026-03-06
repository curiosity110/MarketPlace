// Shared visual tokens: primitives compose these class groups to keep styling ownership centralized.
export const uiTypography = {
  pageTitle: "text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]",
  sectionTitle: "text-base font-semibold tracking-tight text-foreground/92",
  cardTitle: "text-base font-semibold tracking-tight text-foreground",
  body: "text-sm text-foreground",
  muted: "text-sm leading-6 text-muted-foreground",
  label: "text-[0.7rem] font-medium uppercase tracking-[0.08em] text-muted-foreground",
  eyebrow: "text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground",
};

export const uiSpacing = {
  sectionStack: "space-y-4 sm:space-y-5",
  cardPadding: "p-4 sm:p-4.5",
  cardHeaderPadding: "p-4 pb-2.5 sm:p-4.5 sm:pb-2.5",
  cardHeaderGap: "space-y-1.5",
  modalBodyPadding: "p-4 sm:p-5",
};

export const uiSurface = {
  card:
    "rounded-[1.35rem] bg-card text-card-foreground ring-1 ring-black/5 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.42)] dark:ring-white/10",
  cardSubtle: "rounded-[1.35rem] bg-muted/40 ring-1 ring-black/5 dark:ring-white/10",
  cardStrong:
    "rounded-[1.35rem] bg-card text-card-foreground ring-1 ring-black/10 shadow-[0_18px_44px_-34px_rgba(15,23,42,0.35)] dark:ring-white/10",
};

export const uiControls = {
  iconButton: "h-9 w-9 p-0",
  inputBase:
    "h-10 w-full rounded-[0.95rem] border border-border/70 bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-border focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/10",
  textareaBase:
    "min-h-24 w-full rounded-[0.95rem] border border-border/70 bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-150 hover:border-border focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/10",
  selectBase:
    "h-10 min-w-0 w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-[0.95rem] border border-border/70 bg-input px-3 text-sm text-foreground transition-colors duration-150 hover:border-border focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
};

export const uiModal = {
  overlayCenter: "fixed inset-0 flex items-center justify-center p-3",
  overlayTop:
    "fixed inset-0 flex items-start justify-center overflow-y-auto p-2 pt-3 sm:p-4 sm:pt-5",
  backdrop: "absolute inset-0 bg-black/30 backdrop-blur-[1px]",
  panel:
    "relative w-full rounded-[1.4rem] bg-background shadow-[0_28px_80px_-36px_rgba(2,6,23,0.55)] ring-1 ring-black/10 dark:ring-white/10",
  header:
    "flex items-start justify-between gap-2 border-b border-border/50 px-4 py-3 sm:px-5",
  body: "p-4 sm:p-5",
  footer: "mt-4 flex flex-wrap justify-end gap-2",
};
