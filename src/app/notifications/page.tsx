import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/actions/notifications";
import { getServerLocale } from "@/lib/i18n";
import { NotificationsList } from "@/components/notifications-list";
import { EmptyState, PageContainer, PageHeader } from "@/components/ui/layout";

export default async function NotificationsPage() {
  await requireUser();
  const locale = await getServerLocale();
  const isMk = locale === "mk";
  const text = isMk
    ? {
        title: "Известувања",
        subtitle: "Следи што е ново со твоите огласи и активности.",
        empty: "Сè уште нема известувања.",
      }
    : {
        title: "Notifications",
        subtitle: "Track updates about your listings and activity.",
        empty: "No notifications yet.",
      };

  const { items } = await listNotifications({ limit: 100 });

  return (
    <PageContainer className="space-y-5">
      <PageHeader
        title={text.title}
        subtitle={text.subtitle}
        className="hero-surface"
      />

      {items.length === 0 ? (
        <EmptyState title={text.empty} className="py-10" />
      ) : (
        <NotificationsList locale={locale} items={items} />
      )}
    </PageContainer>
  );
}
