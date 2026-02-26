import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";

export default async function AdminSubscriptions() {
  // Mock data - in production, fetch from database
  const stats = {
    totalRevenue: 12450,
    monthlySubscribers: 48,
    payPerListings: 156,
    activeListers: 204,
  };

  const revenueData = [
    { month: "Jan", premium: 1400, payPerListing: 1200 },
    { month: "Feb", premium: 1800, payPerListing: 1500 },
    { month: "Mar", premium: 2100, payPerListing: 1800 },
    { month: "Apr", premium: 2400, payPerListing: 2000 },
    { month: "May", premium: 2800, payPerListing: 2200 },
    { month: "Jun", premium: 3200, payPerListing: 2400 },
  ];

  const subscriberSessions = [
    {
      id: 1,
      username: "john_seller",
      plan: "Premium",
      listings: 12,
      revenue: 360,
      joined: "2024-01-15",
      status: "active",
    },
    {
      id: 2,
      username: "mary_deals",
      plan: "Pay Per Listing",
      listings: 5,
      revenue: 20,
      joined: "2024-02-20",
      status: "active",
    },
    {
      id: 3,
      username: "fast_trader",
      plan: "Premium",
      listings: 24,
      revenue: 720,
      joined: "2023-12-10",
      status: "active",
    },
  ];

  return (
    <Container className="space-y-8 py-8">
      <div>
        <h1 className="text-4xl font-bold">Subscriptions & Revenue</h1>
        <p className="text-muted-foreground mt-2">Monitor seller plans and collect payments</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: DollarSign,
            label: "Total Revenue",
            value: `$${stats.totalRevenue.toLocaleString()}`,
            change: "+12.5%",
            color: "text-green-500",
          },
          {
            icon: Users,
            label: "Premium Subscribers",
            value: stats.monthlySubscribers,
            change: "+8 this month",
            color: "text-orange-500",
          },
          {
            icon: TrendingUp,
            label: "Pay-Per-Listing Sales",
            value: stats.payPerListings,
            change: "+24 this month",
            color: "text-blue-500",
          },
          {
            icon: BarChart3,
            label: "Active Sellers",
            value: stats.activeListers,
            change: "+18 this month",
            color: "text-purple-500",
          },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <ArrowUpRight size={12} />
                    {stat.change}
                  </p>
                </div>
                <stat.icon className={`${stat.color} -mt-1`} size={28} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full h-64 bg-gradient-to-b from-primary/20 to-secondary/20 rounded-lg flex items-end justify-around p-4">
              {revenueData.map((data) => {
                const maxValue = 6000;
                const premiumHeight = (data.premium / maxValue) * 100;
                const payHeight = (data.payPerListing / maxValue) * 100;

                return (
                  <div key={data.month} className="flex-1 flex items-end gap-1 justify-center h-full">
                    <div
                      className="w-3 bg-primary rounded-t transition-all hover:opacity-80"
                      style={{ height: `${premiumHeight}%` }}
                      title={`${data.month} Premium: $${data.premium}`}
                    />
                    <div
                      className="w-3 bg-secondary rounded-t transition-all hover:opacity-80"
                      style={{ height: `${payHeight}%` }}
                      title={`${data.month} Pay-Per-Listing: $${data.payPerListing}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-6 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded" />
                <span>Premium Subscription</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-secondary rounded" />
                <span>Pay-Per-Listing</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Subscribers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Username</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Plan</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Listings</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriberSessions.map((sub) => (
                  <tr key={sub.id} className="border-b border-muted hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium">{sub.username}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          sub.plan === "Premium"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-4 px-4">{sub.listings}</td>
                    <td className="py-4 px-4 font-semibold">${sub.revenue}</td>
                    <td className="py-4 px-4 text-muted-foreground">{sub.joined}</td>
                    <td className="py-4 px-4">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Active
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}
