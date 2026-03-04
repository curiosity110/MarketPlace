import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/actions/notifications";
import { getServerLocale } from "@/lib/i18n";
import { NotificationsList } from "@/components/notifications-list";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-5">
      <section className="hero-surface rounded-3xl border border-border/70 p-6 sm:p-8">
        <h1 className="text-4xl font-black">{text.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{text.subtitle}</p>
      </section>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {text.empty}
          </CardContent>
        </Card>
      ) : (
        <NotificationsList locale={locale} items={items} />
      )}
    </div>
  );
}
