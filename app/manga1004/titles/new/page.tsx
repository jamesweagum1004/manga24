import { createTitleAction } from "../actions";
import { TitleForm } from "../title-form";
import { emptyTitleFormValues } from "@/lib/db/queries/titles";
import { isDatabaseConfigured } from "@/lib/data/source";

export const dynamic = "force-dynamic";

export default function AdminNewTitlePage() {
  const writesEnabled = isDatabaseConfigured();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-black">New Title</h1>
      <TitleForm
        action={createTitleAction}
        initialState={{ values: emptyTitleFormValues }}
        submitLabel="Create Title"
        writesEnabled={writesEnabled}
      />
    </main>
  );
}
