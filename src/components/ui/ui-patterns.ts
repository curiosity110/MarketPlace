// Shared visual tokens: primitives compose these class groups to keep styling ownership centralized.
export const uiTypography = {
  pageTitle: "text-[2rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.55rem]",
  sectionTitle: "text-[1.1rem] font-semibold tracking-[-0.03em] text-foreground/95 sm:text-[1.2rem]",
  cardTitle: "text-[1.02rem] font-semibold tracking-[-0.03em] text-foreground",
  body: "text-sm leading-6 text-foreground/92",
  muted: "text-sm leading-6 text-muted-foreground",
  label: "text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground",
  eyebrow: "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
};

export const uiSpacing = {
  sectionStack: "space-y-5 sm:space-y-6",
  cardPadding: "p-4 sm:p-5",
  cardHeaderPadding: "p-4 pb-2 sm:p-5 sm:pb-2.5",
  cardHeaderGap: "space-y-1.5",
  modalBodyPadding: "p-4 sm:p-6",
};

export const uiSurface = {
  card:
    "rounded-[1.75rem] market-surface text-card-foreground ring-1 ring-black/4 shadow-[0_18px_50px_-42px_rgba(48,35,24,0.28)] dark:ring-white/10",
  cardSubtle:
    "rounded-[1.6rem] bg-muted/48 text-card-foreground ring-1 ring-black/4 dark:ring-white/10",
  cardStrong:
    "rounded-[1.85rem] bg-card text-card-foreground ring-1 ring-black/6 shadow-[0_26px_70px_-48px_rgba(48,35,24,0.3)] dark:ring-white/10",
};

export const uiControls = {
  iconButton: "h-10 w-10 rounded-full p-0",
  inputBase:
    "h-12 w-full rounded-full border border-border/55 bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 hover:border-border/75 focus:border-primary/35 focus:outline-none focus:ring-4 focus:ring-primary/10",
  textareaBase:
    "min-h-28 w-full rounded-[1.35rem] border border-border/55 bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150 hover:border-border/75 focus:border-primary/35 focus:outline-none focus:ring-4 focus:ring-primary/10",
  selectBase:
    "h-12 min-w-0 w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-border/55 bg-input px-4 text-sm text-foreground transition-all duration-150 hover:border-border/75 focus:border-primary/35 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50",
};

export const uiModal = {
  overlayCenter: "fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-3",
  overlayTop:
    "fixed inset-0 flex items-start justify-center overflow-y-auto p-2 pt-3 sm:p-4 sm:pt-5",
  backdrop: "absolute inset-0 bg-[rgba(33,26,20,0.26)] backdrop-blur-[2px]",
  panel:
    "relative w-full max-h-[88dvh] overflow-hidden rounded-t-[1.5rem] bg-background shadow-[0_28px_90px_-42px_rgba(48,35,24,0.38)] ring-1 ring-black/8 dark:ring-white/10 sm:max-h-none sm:rounded-[1.8rem]",
  header:
    "flex items-start justify-between gap-2 border-b border-border/50 px-4 py-3 sm:px-5",
  body: "p-4 sm:p-5",
  footer: "mt-4 flex flex-wrap justify-end gap-2",
};
