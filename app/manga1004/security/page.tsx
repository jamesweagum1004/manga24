import { listAdmins } from "@/lib/db/queries/admins";
import { changePasswordAction, createAdminAction, updateAdminAction } from "./actions";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  "invalid-admin": "Check the administrator details. Passwords must contain at least 12 characters.",
  "duplicate-admin": "That username or email is already in use.",
  "invalid-password": "The new password is invalid or the confirmation does not match.",
  "current-password": "The current password is incorrect.",
  "self-disable": "You cannot disable the account used for this session."
};

export default async function AdminSecurityPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [admins, query] = await Promise.all([listAdmins(), searchParams]);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-black">Security</h1>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">Manage private administrator access.</p>
      </div>

      {query.error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
          {errorMessages[query.error] ?? "Unable to save the change."}
        </p>
      ) : null}
      {query.saved ? (
        <p className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm font-bold text-green-800">
          Change saved successfully.
        </p>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-xl font-black">Change my password</h2>
        <form action={changePasswordAction} className="mt-4 grid max-w-xl gap-3">
          <input name="currentPassword" type="password" autoComplete="current-password" placeholder="Current password" required className="rounded-lg border p-3" />
          <input name="newPassword" type="password" autoComplete="new-password" placeholder="New password (12+ characters)" required className="rounded-lg border p-3" />
          <input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Confirm new password" required className="rounded-lg border p-3" />
          <button className="w-fit rounded-lg bg-[var(--accent)] px-4 py-2 font-black text-white">Change password</button>
        </form>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <h2 className="text-xl font-black">Administrators</h2>
        <div className="mt-4 grid gap-3">
          {admins.map((admin) => (
            <form key={admin.id} action={updateAdminAction} className="grid gap-2 rounded-lg border border-[var(--border)] p-3 text-sm sm:grid-cols-2">
              <input type="hidden" name="adminId" value={admin.id} />
              <strong className="self-center">{admin.username ?? "Not initialized"}</strong>
              <label className="flex items-center gap-2 font-bold">
                <input name="isActive" type="checkbox" defaultChecked={admin.isActive} />
                Active
              </label>
              <input name="displayName" defaultValue={admin.displayName} required className="rounded-lg border p-2" />
              <input name="email" type="email" defaultValue={admin.email} required className="rounded-lg border p-2" />
              <input name="password" type="password" placeholder="New password (leave blank to keep)" className="rounded-lg border p-2 sm:col-span-2" />
              <button className="w-fit rounded-lg border border-[var(--border)] px-3 py-2 font-black">Save administrator</button>
            </form>
          ))}
        </div>
        <h3 className="mt-6 font-black">Add administrator</h3>
        <form action={createAdminAction} className="mt-3 grid max-w-xl gap-3">
          <input name="username" placeholder="Username" required className="rounded-lg border p-3" />
          <input name="displayName" placeholder="Display name" required className="rounded-lg border p-3" />
          <input name="email" type="email" placeholder="Email" required className="rounded-lg border p-3" />
          <input name="password" type="password" autoComplete="new-password" placeholder="Temporary password (12+ characters)" required className="rounded-lg border p-3" />
          <button className="w-fit rounded-lg bg-[var(--accent)] px-4 py-2 font-black text-white">Add administrator</button>
        </form>
      </section>
    </main>
  );
}
