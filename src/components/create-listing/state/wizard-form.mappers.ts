import type {
  CreateListingActionResult,
  CreateSubmitIntent,
} from "@/components/create-listing/state/wizard-form.types";

type SuccessMessages = {
  publishedSuccess: string;
  draftSavedInline: string;
  defaultsSaved: string;
};

export function resolveCreateSuccessMessage(
  result: CreateListingActionResult & { ok: true },
  submitIntent: CreateSubmitIntent,
  text: SuccessMessages,
) {
  if (submitIntent === "publish" && result.status === "ACTIVE") {
    return result.message || text.publishedSuccess;
  }
  if (submitIntent === "draft") return result.message || text.draftSavedInline;
  if (submitIntent === "save-defaults") return result.message || text.defaultsSaved;
  return result.message || null;
}
