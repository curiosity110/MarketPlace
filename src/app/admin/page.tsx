import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AdminPage() {
  await requireAdmin();
  const [reports, actions] = await Promise.all([
    prisma.report.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" } }),
    prisma.adminAction.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="text-xl">Reports Queue</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th>Target</th><th>Reason</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-border">
                    <td className="py-2">{report.targetType}: {report.targetId}</td>
                    <td className="py-2">{report.reason}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <form action="/api/admin/remove-listing" method="post">
                          <input type="hidden" name="listingId" value={report.targetId} />
                          <input type="hidden" name="reportId" value={report.id} />
                          <Button variant="outline" type="submit">Remove listing</Button>
                        </form>
                        <form action="/api/admin/ban-user" method="post">
                          <input type="hidden" name="userId" value={report.targetId} />
                          <input type="hidden" name="reportId" value={report.id} />
                          <Button variant="outline" type="submit">Ban user</Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-2 text-xl">Audit log</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {actions.map((a) => <li key={a.id}>{a.actionType} on {a.targetType} ({a.targetId})</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
