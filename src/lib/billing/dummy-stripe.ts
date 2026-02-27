export const DUMMY_STRIPE_SUCCESS_CARDS = [
  "4242424242424242",
  "5555555555554444",
] as const;

export const DUMMY_STRIPE_FAIL_CARDS = [
  "4000000000000002",
  "4000000000009995",
] as const;

const SUCCESS_CARD_SET = new Set<string>(DUMMY_STRIPE_SUCCESS_CARDS);
const FAIL_CARD_SET = new Set<string>(DUMMY_STRIPE_FAIL_CARDS);

type DummyPaymentInput = {
  cardNumberRaw: string;
  cardExpRaw: string;
  cardCvcRaw: string;
};

export type DummyPaymentResult =
  | { ok: true; cardNumber: string }
  | { ok: false; error: string };

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function isValidExp(expRaw: string) {
  const trimmed = expRaw.trim();
  const match = /^(\d{2})\/(\d{2})$/.exec(trimmed);
  if (!match) return false;
  const mm = Number(match[1]);
  const yy = Number(match[2]);
  if (mm < 1 || mm > 12) return false;
  if (yy < 0 || yy > 99) return false;
  return true;
}

export function validateDummyStripePayment({
  cardNumberRaw,
  cardExpRaw,
  cardCvcRaw,
}: DummyPaymentInput): DummyPaymentResult {
  const cardNumber = digitsOnly(cardNumberRaw);
  const cvc = digitsOnly(cardCvcRaw);

  if (cardNumber.length !== 16) {
    return {
      ok: false,
      error: "Dummy card number must be 16 digits.",
    };
  }

  if (!isValidExp(cardExpRaw)) {
    return {
      ok: false,
      error: "Card expiry must use MM/YY format.",
    };
  }

  if (cvc.length < 3 || cvc.length > 4) {
    return {
      ok: false,
      error: "Card CVC must be 3 or 4 digits.",
    };
  }

  if (FAIL_CARD_SET.has(cardNumber)) {
    return {
      ok: false,
      error: "Dummy payment failed. Use a success test card.",
    };
  }

  if (!SUCCESS_CARD_SET.has(cardNumber)) {
    return {
      ok: false,
      error:
        "Unknown dummy card. Use 4242424242424242 for success or 4000000000000002 for fail test.",
    };
  }

  return { ok: true, cardNumber };
}
