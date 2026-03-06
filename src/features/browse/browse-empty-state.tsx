import { BrowseEmptyState as BaseBrowseEmptyState } from "@/components/browse-page";

type Props = React.ComponentProps<typeof BaseBrowseEmptyState>;

export function BrowseEmptyState(props: Props) {
  return <BaseBrowseEmptyState {...props} />;
}
