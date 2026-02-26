import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ArrowRight, Search } from "lucide-react";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const categoryIcons: Record<string, string> = {
    electronics: "📱",
    fashion: "👗",
    vehicles: "🚗",
    furniture: "🪑",
    sports: "⚽",
    books: "📚",
    toys: "🧸",
    home: "🏠",
    garden: "🌿",
    tools: "🔧",
    art: "🎨",
    other: "📦",
  };

  const getIcon = (categoryName: string) => {
    const key = categoryName.toLowerCase().replace(/\s+/g, "");
    return categoryIcons[key] || "📦";
  };

  return (
    <Container className="py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Browse Categories</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a category to explore listings or create your own
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-muted-foreground" size={20} />
              <Input
                placeholder="Search categories..."
                className="pl-10 h-11 text-base"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Link key={category.id} href={`/browse?cat=${category.id}`}>
              <Card className="h-full hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group">
                <CardContent className="pt-8">
                  <div className="space-y-4">
                    {/* Icon */}
                    <div className="text-5xl group-hover:scale-125 transition-transform duration-200">
                      {getIcon(category.name)}
                    </div>

                    {/* Category Name */}
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {category.children.length} subcategories
                      </p>
                    </div>

                    {/* Subcategories Preview */}
                    {category.children.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Subcategories
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {category.children.slice(0, 3).map((sub) => (
                            <span
                              key={sub.id}
                              className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full"
                            >
                              {sub.name}
                            </span>
                          ))}
                          {category.children.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                              +{category.children.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="pt-2 flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                      Browse
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Selling CTA */}
        <Card className="bg-gradient-to-r from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 border-2 border-primary/20">
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">Want to Sell?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                List your items in minutes with AI-powered descriptions. Choose your category above and start selling today!
              </p>
              <Link href="/sell">
                <Button size="lg" className="gap-2">
                  Start Selling <ArrowRight size={20} />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
