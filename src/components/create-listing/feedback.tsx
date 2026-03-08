import Link from "next/link";

type Props = {
  successMessage: string | null;
  isClosingAfterSuccess: boolean;
  closingSoonLabel: string;
  stepError: string | null;
  generalServerError: string | null;
  needsEditListingId: string | null;
  openEditLabel: string;
  defaultsSaved: boolean;
  defaultsSavedLabel: string;
};

export function CreateListingFeedback({
  successMessage,
  isClosingAfterSuccess,
  closingSoonLabel,
  stepError,
  generalServerError,
  needsEditListingId,
  openEditLabel,
  defaultsSaved,
  defaultsSavedLabel,
}: Props) {
  return (
    <>
      {successMessage ? (
        <p className="rounded-[1rem] bg-success/10 px-3.5 py-2.5 text-sm font-medium text-success ring-1 ring-success/15">
          {successMessage}
          {isClosingAfterSuccess ? ` ${closingSoonLabel}` : ""}
        </p>
      ) : null}

      {stepError && (
        <p className="rounded-[1rem] bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive ring-1 ring-destructive/15">
          {stepError}
        </p>
      )}

      {generalServerError && (
        <div className="space-y-2 rounded-[1rem] bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive ring-1 ring-destructive/15">
          <p className="leading-6">{generalServerError}</p>
          {needsEditListingId ? (
            <Link
              href={`/sell/${needsEditListingId}/edit`}
              className="inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              {openEditLabel}
            </Link>
          ) : null}
        </div>
      )}

      {defaultsSaved ? (
        <p className="rounded-[1rem] bg-green-500/10 px-3.5 py-2.5 text-sm text-green-700 ring-1 ring-green-400/20 dark:text-green-300">
          {defaultsSavedLabel}
        </p>
      ) : null}
    </>
  );
}
