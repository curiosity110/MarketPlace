type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendEmail(payload: EmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFY_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    console.info(`[notify] ${payload.subject} -> ${payload.to}`);
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Notification email failed:", response.status, errorBody);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Notification email error:", error);
    return false;
  }
}

export async function sendContactRequestEmail(params: {
  sellerEmail: string;
  sellerName: string;
  requesterIdentity: string;
  listingTitle: string;
  message: string;
  listingId: string;
}) {
  const subject = `New phone access request for "${params.listingTitle}"`;
  const text = [
    `Hello ${params.sellerName},`,
    "",
    `${params.requesterIdentity} requested phone access for your listing: ${params.listingTitle}.`,
    "",
    `Reason/message:`,
    params.message,
    "",
    `Review in dashboard: /sell`,
    `Listing id: ${params.listingId}`,
  ].join("\n");

  return sendEmail({
    to: params.sellerEmail,
    subject,
    text,
  });
}

export async function sendContactDecisionEmail(params: {
  requesterEmail: string;
  sellerIdentity: string;
  listingTitle: string;
  approved: boolean;
  sellerResponse?: string | null;
}) {
  const subject = params.approved
    ? `Phone access approved for "${params.listingTitle}"`
    : `Phone access update for "${params.listingTitle}"`;

  const text = [
    `Hello,`,
    "",
    `${params.sellerIdentity} responded to your phone access request for "${params.listingTitle}".`,
    params.approved ? "Status: APPROVED" : "Status: REJECTED",
    params.sellerResponse ? `Seller response: ${params.sellerResponse}` : "",
    "",
    "Open listing details to continue.",
  ]
    .filter(Boolean)
    .join("\n");

  return sendEmail({
    to: params.requesterEmail,
    subject,
    text,
  });
}
