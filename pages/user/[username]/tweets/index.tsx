import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import { Client } from "twitter-api-sdk";
import { text } from "stream/consumers";
import { useRouter } from "next/router";
import { HashLoader } from "react-spinners";
import { authOptions } from "pages/api/auth/[...nextauth]";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { getTweets, getTwitterId, tweetsToTokenText } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function Tweets({
  name,
  username,
  result,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="flex flex-col items-center min-h-screen">
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

  return (
    <>
      <Head>
        <title>{`Perspec - ${
          router.isFallback ? "loading" : username.replace("@", "")
        }`}</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center min-h-screen">
        <div className="w-full flex justify-end px-8 py-4">
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
        <div className="flex flex-col px-8 max-w-6xl flex-grow pb-16 items-center justify-center">
          {!router.isFallback ? (
            <>
              <p className="font-bold text-4xl">{`@${username}`}</p>
              <p className="text-md mt-1">{name}</p>
              <p className="mt-8 whitespace-pre-wrap">{result.trim()}</p>
            </>
          ) : (
            <div className="flex items-center h-full justify-center">
              <HashLoader size={100} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const username = context.params?.username as string;

  const { name, id } = await getTwitterId(username);

  if (!id || !name) {
    return {
      props: { name: "Unknown", username, result: "No user found" },
      revalidate: false,
    };
  }

  const tweets = await getTweets(2, id, true, true);
  if (tweets.length === 0) {
    return {
      props: { name: name, username, result: "Couldn't retreieve any tweets" },
      revalidate: 60,
    };
  }

  const tweetText = await tweetsToTokenText(tweets, 3500);
  return {
    props: { name, username, result: tweetText }, // will be passed to the page component as props
  };
};

export async function getStaticPaths() {
  return {
    paths: [{ params: { username: "elonmusk" } }],
    fallback: true, // can also be true or 'blocking'
  };
}
