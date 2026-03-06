type Props = {
  title: string;
  description: string;
};

export function ListingDetailsDescriptionSection({ title, description }: Props) {
  return (
    <section className="max-w-full space-y-3">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <p className="max-w-[72ch] whitespace-pre-wrap break-words text-sm leading-7 text-foreground/85 [overflow-wrap:anywhere] sm:text-[0.98rem]">
        {description}
      </p>
    </section>
  );
}
