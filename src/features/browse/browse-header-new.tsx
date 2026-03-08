type BrowseHeaderProps = {
  title: string;
  totalCount?: number;
};

export function BrowseHeader({ title, totalCount }: BrowseHeaderProps) {
  return (
    <div className="mt-2 space-y-1.5">
      <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.6rem]">
        {title}
      </h1>
      {totalCount !== undefined ? (
        <p className="text-sm text-muted-foreground">{totalCount} listings</p>
      ) : null}
    </div>
  );
}
