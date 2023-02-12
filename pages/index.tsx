import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
// import { useRouter } from "next/router";

export default function Home() {
  // const router = useRouter();
  const { status } = useSession();
  // const [users, setUsers] = useState<string | null>(null);
  // const [isLoadingUsers, setIsLoadingUsers] = useState(false);
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

  // const getUsers = async (query: string) => {
  //   if (query.length > 5) {
  //     try {
  //       setIsLoadingUsers(true);
  //       const res = await fetch("/api/tweets/users", {
  //         method: "POST",
  //         body: JSON.stringify({ query }),
  //       });
  //       if (res.ok) {
  //         const resJson = await res.json();
  //         const usersResult = resJson.data?.users;
  //         setUsers(usersResult);
  //       } else {
  //         const usersResult = setUsers(
  //           "Sorry, we couldn't analyze this question. Please try again later."
  //         );
  //       }
  //       setIsLoadingUsers(false);
  //     } catch (error) {
  //       setIsLoadingUsers(false);
  //       setUsers(null);
  //     }
  //   } else {
  //     setUsers(null);
  //   }
  // };

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
          <p>{`Get started by going to /{username}`}</p>
          {/* <input
            type="text"
            className="w-full max-w-xl mt-12 text-sm px-4 py-2 bg-black/10 rounded-full focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setUsers(null);
                getUsers(e.currentTarget.value);
              }
            }}
          /> */}
        </div>
      </main>
    </>
  );
}
