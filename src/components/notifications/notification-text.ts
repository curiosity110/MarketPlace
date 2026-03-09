export function getNotificationText(locale: "en" | "mk") {
  if (locale === "mk") {
    return {
      notifications: "Известувања",
      noNotifications: "Нема известувања.",
      markRead: "Означи прочитано",
      markAllRead: "Означи сите прочитани",
    };
  }

  return {
    notifications: "Notifications",
    noNotifications: "No notifications.",
    markRead: "Mark read",
    markAllRead: "Mark all read",
  };
}
