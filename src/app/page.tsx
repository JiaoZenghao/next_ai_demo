import { logoutAction } from "@/app/actions/logout";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/data/auth";

export default async function Home() {
  await verifySession();

  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 p-6">
      <section className="w-full max-w-3xl rounded-xl border bg-card p-8 shadow-sm sm:p-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              Protected workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-tight">AI Demo</h1>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </div>
        <p className="mt-10 max-w-xl text-lg leading-8 text-muted-foreground">
          You are signed in to the protected AI Demo application.
        </p>
      </section>
    </main>
  );
}
