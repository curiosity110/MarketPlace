type Props = {
  title: string;
  description: string;
};

export function ListingDetailsDescriptionSection({ title, description }: Props) {
  return (
    <div className="max-w-full rounded-xl bg-muted/20 p-4 ring-1 ring-border/60 sm:p-5">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <p className="mt-2 max-w-full whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85 [overflow-wrap:anywhere] sm:text-[0.95rem]">
        {description}
      </p>
    </div>
  );
}
