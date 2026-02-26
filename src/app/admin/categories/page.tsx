import { CategoryFieldType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

async function toggleCategory(formData: FormData) {
  "use server";
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") || "");
  const isActive = String(formData.get("isActive") || "") === "true";

  await prisma.category.update({ where: { id: categoryId }, data: { isActive: !isActive } });
  revalidatePath("/admin/categories");
  revalidatePath("/sell");
  revalidatePath("/browse");
}

async function createTemplate(formData: FormData) {
  "use server";
  await requireAdmin();

  const categoryId = String(formData.get("categoryId") || "");
  const key = String(formData.get("key") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const type = formData.get("type") as CategoryFieldType;
  const required = String(formData.get("required") || "") === "on";
  const order = Number(formData.get("order") || 0);
  const optionsRaw = String(formData.get("options") || "").trim();
  const options = optionsRaw ? optionsRaw.split(",").map((item) => item.trim()).filter(Boolean) : [];

  if (!categoryId || !key || !label) return;

  await prisma.categoryFieldTemplate.create({
    data: {
      categoryId,
      key,
      label,
      type,
      required,
      order: Number.isFinite(order) ? order : 0,
      optionsJson: type === CategoryFieldType.SELECT ? JSON.stringify(options) : null,
    },
  });

  revalidatePath("/admin/categories");
}

async function updateTemplate(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const label = String(formData.get("label") || "").trim();
  const required = String(formData.get("required") || "") === "on";
  const isActive = String(formData.get("isActive") || "") === "on";

  await prisma.categoryFieldTemplate.update({
    where: { id },
    data: { label, required, isActive },
  });

  revalidatePath("/admin/categories");
}

async function deleteTemplate(formData: FormData) {
  "use server";
  await requireAdmin();

  const id = String(formData.get("id") || "");
  await prisma.categoryFieldTemplate.delete({ where: { id } });
  revalidatePath("/admin/categories");
}

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { fieldTemplates: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin · Categories</h1>
      {categories.map((category) => (
        <Card key={category.id}>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">{category.name}</h2>
                <p className="text-xs text-muted-foreground">/{category.slug}</p>
              </div>
              <form action={toggleCategory}>
                <input type="hidden" name="categoryId" value={category.id} />
                <input type="hidden" name="isActive" value={String(category.isActive)} />
                <Button type="submit" variant={category.isActive ? "outline" : "default"}>
                  {category.isActive ? "Deactivate" : "Activate"}
                </Button>
              </form>
            </div>

            <div className="space-y-2">
              {category.fieldTemplates.map((template) => (
                <div key={template.id} className="rounded-md border border-border p-2">
                  <form action={updateTemplate} className="grid gap-2 md:grid-cols-6">
                    <input type="hidden" name="id" value={template.id} />
                    <Input name="label" defaultValue={template.label} className="md:col-span-2" />
                    <Input value={template.key} readOnly className="bg-muted" />
                    <Input value={template.type} readOnly className="bg-muted" />
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" name="required" defaultChecked={template.required} /> Required
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" name="isActive" defaultChecked={template.isActive} /> Active
                    </label>
                    <div className="md:col-span-6 flex gap-2">
                      <Button type="submit" variant="outline">Save template</Button>
                    </div>
                  </form>
                  <form action={deleteTemplate} className="mt-2">
                    <input type="hidden" name="id" value={template.id} />
                    <Button type="submit" variant="destructive">Delete</Button>
                  </form>
                </div>
              ))}
            </div>

            <form action={createTemplate} className="grid gap-2 rounded-md border border-dashed border-border p-3 md:grid-cols-7">
              <input type="hidden" name="categoryId" value={category.id} />
              <Input name="key" placeholder="key (e.g. brand)" required />
              <Input name="label" placeholder="Label" required />
              <Select name="type" defaultValue={CategoryFieldType.TEXT}>
                {Object.values(CategoryFieldType).map((type) => <option key={type} value={type}>{type}</option>)}
              </Select>
              <Input type="number" name="order" defaultValue={0} placeholder="Order" />
              <Input name="options" placeholder="a,b,c for SELECT" />
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" name="required" /> Required
              </label>
              <Button className="md:col-span-7" type="submit">Add template</Button>
            </form>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
