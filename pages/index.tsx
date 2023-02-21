import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Home() {
  // const router = useRouter();
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </main>
    );
  }
  if (status === "unauthenticated") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen">
        <p>
          <button type="button" onClick={() => signIn()}>
            Sign in
          </button>
        </p>
      </main>
    );
  }

  const goToUser = (username: string) => {
    if (username.length > 4 && router.isReady) {
      router.push(`/${username.replace("@", "")}`);
    }
  };

  return (
    <>
      <Head>
        <title>Perspec</title>
        <meta name="description" content="Perspec alpha" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center items-center min-h-screen">
        <div>
          <p>{`Enter a username to get started`}</p>
          <input
            type="text"
            className="w-full max-w-xl mt-12 text-sm px-4 py-2 bg-black/10 rounded-full focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                goToUser(e.currentTarget.value);
              }
            }}
          />
        </div>
      </main>
    </>
  );
}
