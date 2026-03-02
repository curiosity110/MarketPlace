export async function GET(request: Request) {
  const url = new URL(request.url);
  url.pathname = "/auth/callback";
  return Response.redirect(url);
}
