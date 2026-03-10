import { createListingFromSell } from "@/lib/actions/create-listing";
import { CreateListingModalRoot } from "@/components/create-listing-modal-root";

export function CreateListingModalRootServer() {
  return <CreateListingModalRoot action={createListingFromSell} />;
}
