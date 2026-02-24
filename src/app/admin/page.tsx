import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  await requireAdmin();
  const [reports, actions] = await Promise.all([
    prisma.report.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" } }),
    prisma.adminAction.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>
      <section>
        <h2 className="text-xl">Reports Queue</h2>
        <ul className="space-y-2">
          {reports.map((report) => (
            <li key={report.id} className="rounded border p-3 space-y-2">
              <p>{report.targetType}: {report.targetId}</p>
              <p>{report.reason}</p>
              <form action="/api/admin/remove-listing" method="post" className="inline-block mr-2">
                <input type="hidden" name="listingId" value={report.targetId} />
                <input type="hidden" name="reportId" value={report.id} />
                <button className="rounded border px-2 py-1" type="submit">Remove listing</button>
              </form>
              <form action="/api/admin/ban-user" method="post" className="inline-block">
                <input type="hidden" name="userId" value={report.targetId} />
                <input type="hidden" name="reportId" value={report.id} />
                <button className="rounded border px-2 py-1" type="submit">Ban user</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl">Audit log</h2>
        <ul className="space-y-1">{actions.map((a) => <li key={a.id}>{a.actionType} on {a.targetType} ({a.targetId})</li>)}</ul>
      </section>
    </div>
  );
}
