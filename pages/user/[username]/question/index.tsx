import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import { Client } from "twitter-api-sdk";
import { text } from "stream/consumers";
import { useRouter } from "next/router";
import { HashLoader } from "react-spinners";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { getTweets, getTwitterId } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export default function Question({
  name,
  username,
  result,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
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

  const analyzeTweets = async ({ question }: { question: string }) => {
    if (question.length > 5) {
      try {
        setIsLoadingAnalysis(true);
        const res = await fetch("/api/tweets/question", {
          method: "POST",
          body: JSON.stringify({ question, username, tweets: result }),
        });
        if (res.ok) {
          const resJson = await res.json();
          const analysisResult = resJson.data?.analysis;
          setAnalysis(analysisResult);
        } else {
          const analysisResult = setAnalysis(
            "Sorry, we couldn't analyze this question. Please try again later."
          );
        }
        setIsLoadingAnalysis(false);
      } catch (error) {
        setIsLoadingAnalysis(false);
        setAnalysis(null);
      }
    } else {
      setAnalysis(null);
    }
  };

  return (
    <>
      <Head>
        <title>{`Perspec - ${router.isFallback ? "loading" : username}`}</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center w-full min-h-screen">
        <div className="w-full flex justify-end px-8 py-4">
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
        <div className="flex flex-col w-full px-8 max-w-6xl flex-grow items-center justify-center">
          {!router.isFallback ? (
            <>
              <p className="font-bold text-4xl">{`@${username.replace(
                "@",
                ""
              )}`}</p>
              <p className="text-md mt-1">{name}</p>
              <input
                type="text"
                className="w-full max-w-xl mt-12 text-sm px-4 py-2 bg-black/10 rounded-full focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAnalysis(null);
                    analyzeTweets({
                      question: e.currentTarget.value,
                    });
                  }
                }}
              />
              {isLoadingAnalysis && (
                <div className="flex items-center mt-8 h-full justify-center">
                  <HashLoader size={50} />
                </div>
              )}
              <p className="mt-8 whitespace-pre-wrap">
                {analysis && analysis.trim()}
              </p>
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
  const username = context.params?.username as string | undefined;

  if (!username) {
    return {
      props: {
        name: "Unknown",
        username: "Invalid user",
        result: "Missing username",
      },
      revalidate: false,
    };
  }

  const { name, id } = await getTwitterId(username);

  if (!id || !name) {
    return {
      props: {
        name: "Unknown",
        username: username,
        result: "Failed to find user",
      },
      revalidate: false,
    };
  }

  //Get all tweets
  const tweets = await getTweets(1, id, true, true);

  if (tweets.length == 0) {
    return {
      props: {
        name: name,
        username: "Invalid user",
        result: "Failed to retrieve tweets",
      },
      revalidate: 60,
    };
  }

  return {
    props: {
      name,
      username,
      result: tweets,
    },
    revalidate: false,
  };
};

export async function getStaticPaths() {
  return {
    paths: [{ params: { username: "elonmusk" } }],
    fallback: true,
  };
}
