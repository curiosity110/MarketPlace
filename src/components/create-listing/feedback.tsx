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
        <p className="rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm font-medium text-success">
          {successMessage}
          {isClosingAfterSuccess ? ` ${closingSoonLabel}` : ""}
        </p>
      ) : null}

      {stepError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {stepError}
        </p>
      )}

      {generalServerError && (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <p>{generalServerError}</p>
          {needsEditListingId ? (
            <Link
              href={`/sell/${needsEditListingId}/edit`}
              className="inline-flex rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
            >
              {openEditLabel}
            </Link>
          ) : null}
        </div>
      )}

      {defaultsSaved ? (
        <p className="rounded-lg border border-green-300/60 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {defaultsSavedLabel}
        </p>
      ) : null}
    </>
  );
}
