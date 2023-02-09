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

const inter = Inter({ subsets: ["latin"] });

export default function User({
  realName,
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
        <title>{`Perspec - ${router.isFallback ? "loading" : username}`}</title>
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
        <div className="flex flex-col px-8 max-w-6xl flex-grow items-center justify-center">
          {!router.isFallback ? (
            <>
              <p className="font-bold text-4xl">{`@${username}`}</p>
              <p className="text-md mt-1">{realName}</p>
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
  const { Configuration, OpenAIApi } = require("openai");
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

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const client = new Client(process.env.TWITTER_BEARER_TOKEN);

  const idResponse = await client.users.findUserByUsername(username);

  if (!idResponse.data?.id || !idResponse.data?.name) {
    return {
      props: { realName: "Unknown", username, result: "No user found" },
      revalidate: false,
    };
  }
  const realName = idResponse.data.name;

  const tweets1 = await client.tweets.usersIdTweets(idResponse.data?.id, {
    max_results: 100,
    exclude: ["replies", "retweets"],
  });

  if (!tweets1?.meta?.oldest_id) {
    return {
      props: { realName, username, result: "Failed to load twitter metadata" },
      revalidate: 60,
    };
  }

  const tweets2 = await client.tweets.usersIdTweets(idResponse.data?.id, {
    max_results: 100,
    until_id: tweets1.meta.oldest_id,
    exclude: ["replies", "retweets"],
  });

  if (!tweets1?.data) {
    return {
      props: { realName, username, result: "Failed to load tweets" },
      revalidate: 60,
    };
  }

  const tweets = [...tweets1.data, ...(tweets2.data ? tweets2.data : [])];
  const tweetTextRaw = tweets
    .map((tweet) => tweet.text)
    .filter((text) => text.split(" ").length > 6)
    .join(" ")
    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "")
    .replaceAll("\n", " ")
    .replaceAll("  ", " ");

  const encoded = encode(tweetTextRaw);
  const tweetText = decode(encoded.slice(0, 3500));
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Provided some tweets, act as a psychiatrist by describing the author in detail, including a list of some of their personal values and interests.\nTweets: ${tweetText}.\nAnalysis:`,
      temperature: 0.75,
      max_tokens: 400,
    });
    if (response.status === 429) {
      return {
        props: {
          realName,
          username,
          result: `Failed to generate response. Too many requests, try again in a moment.`,
        },
        revalidate: 60,
      };
    }

    return {
      props: { realName, username, result: response.data.choices[0].text },
      revalidate: false,
    };
  } catch (e) {
    return {
      props: {
        realName,
        username,
        result: `Failed to generate response. ${e}`,
      },
      revalidate: 60,
    };
  }
};

export async function getStaticPaths() {
  return {
    paths: [{ params: { username: "elonmusk" } }],
    fallback: true, // can also be true or 'blocking'
  };
}
