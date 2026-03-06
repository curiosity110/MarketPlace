export function getProfilePageText(locale: "en" | "mk") {
  if (locale === "mk") {
    return {
      dbUnavailable: "Базата е привремено недостапна. Обиди се повторно наскоро.",
      myProfile: "Мој профил",
      manageAllInfo: "Јавен идентитет и активни огласи на едно мирно место.",
      back: "Назад",
      backToDashboard: "Назад кон табла",
      profileSaved: "Профилот е зачуван.",
      billingPassed: "Dummy Stripe плаќањето е успешно.",
      memberSince: "Член од",
      listings: "огласи",
      active: "Активни",
      email: "Е-пошта",
      sellerStatus: "Статус на продавач",
      location: "Локација",
      noActiveListings: "Моментално нема активни огласи.",
      settings: "Подесувања на профил",
      subscription: "Објавување и претплата",
      profileLocationLabel: "Локација",
    };
  }

  return {
    dbUnavailable: "Database is temporarily unreachable. Please retry in a moment.",
    myProfile: "My profile",
    manageAllInfo: "Public seller identity and active listings in one calm place.",
    back: "Back",
    backToDashboard: "Back to dashboard",
    profileSaved: "Profile saved.",
    billingPassed: "Dummy Stripe payment passed.",
    memberSince: "Member since",
    listings: "listings",
    active: "Active",
    email: "Email",
    sellerStatus: "Seller status",
    location: "Location",
    noActiveListings: "You do not have active listings right now.",
    settings: "Profile settings",
    subscription: "Posting and subscription",
    profileLocationLabel: "Location",
  };
}
