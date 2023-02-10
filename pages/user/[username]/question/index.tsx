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

const inter = Inter({ subsets: ["latin"] });

export default function Question({
  realName,
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
        const res = await fetch("/api/tweets/analyze/search", {
          method: "POST",
          body: JSON.stringify({ question, username, tweets: result }),
        });
        const resJson = await res.json();
        const analysisResult = resJson.data?.analysis;
        setIsLoadingAnalysis(false);
        setAnalysis(analysisResult);
      } catch (error) {
        setIsLoadingAnalysis(false);
        setAnalysis(null);
        console.log(error);
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
              <p className="font-bold text-4xl">{`@${username}`}</p>
              <p className="text-md mt-1">{realName}</p>
              <input
                type="text"
                className="w-full max-w-xl mt-12 text-sm px-4 py-2 bg-black/10 rounded-full focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAnalysis(null);
                    analyzeTweets({
                      question: e.currentTarget.value,
                    });
                    e.currentTarget.value = "";
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
  const username = context.params?.username as string;
  const { encode, decode } = require("gpt-3-encoder");
  //Return erro if missing env vars
  if (
    !process.env.TWITTER_BEARER_TOKEN ||
    !process.env.OPENAI_API_KEY ||
    !username
  ) {
    return {
      props: {
        realName: "Unknown",
        username,
        result: "Environment Configuration Error",
      },
    };
  }

  const client = new Client(process.env.TWITTER_BEARER_TOKEN);

  const idResponse = await client.users.findUserByUsername(username);

  if (!idResponse.data?.id || !idResponse.data?.name) {
    return {
      props: {
        realName: "Unknown",
        username: "Invalid user",
      },
    };
  }
  const realName = idResponse.data.name;

  //Get all tweets
  const tweets = await client.tweets.usersIdTweets(idResponse.data?.id, {
    max_results: 100,
    exclude: ["replies", "retweets"],
  });

  return {
    props: {
      realName,
      username,
      result:
        tweets?.data?.map((tweet) => ({ id: tweet.id, text: tweet.text })) ??
        [],
    },
    revalidate: false,
  };
};

export async function getStaticPaths() {
  return {
    paths: [{ params: { username: "elonmusk" } }],
    fallback: true, // can also be true or 'blocking'
  };
}