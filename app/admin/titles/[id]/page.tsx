import { notFound } from "next/navigation";
import { getAdminTitleById, isDatabaseConfigured } from "@/lib/data/source";
import { updateTitleAction } from "../actions";
import { TitleForm } from "../title-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminTitleEditPage({ params }: PageProps) {
  const { id } = await params;
  const title = await getAdminTitleById(id);
  if (!title) {
    notFound();
  }
  const updateAction = updateTitleAction.bind(null, title.id);
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black">{title.values.originalTitle}</h1>
      <TitleForm
        action={updateAction}
        initialState={{ values: title.values }}
        submitLabel="Save Title"
        writesEnabled={writesEnabled}
      />
    </main>
  );
}
