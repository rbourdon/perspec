import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { HashLoader } from "react-spinners";
import type { InferGetStaticPropsType, GetStaticProps } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { getTweetsFromUser, getTwitterId } from "@/lib/utils/twitter";
import { motion } from "framer-motion";

export default function Question({
  name,
  username,
  pic,
  result,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const { status } = useSession();
  const [aiResponse, setAiResponse] = useState<{
    firstPerson: string;
    thirdPerson: string;
  } | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
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

  const analyzeTweets = async (question: string) => {
    if (question.length > 5) {
      try {
        setIsLoadingAnalysis(true);
        const [res, res2] = await Promise.all([
          fetch("/api/tweets/question/first", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, username, tweets: result }),
          }),
          fetch("/api/tweets/question/third", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, username, tweets: result }),
          }),
        ]);

        if (res.ok && res.body && res2.ok && res2.body) {
          setIsLoadingAnalysis(false);
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          const reader2 = res2.body.getReader();
          const decoder2 = new TextDecoder();
          let done2 = false;
          let done = false;

          while (!done || !done2) {
            if (!done) {
              const { value, done: doneReading } = await reader.read();

              done = doneReading;
              const chunkValue = decoder.decode(value);

              setAiResponse((prev) =>
                prev
                  ? {
                      firstPerson: prev.firstPerson + chunkValue,
                      thirdPerson: prev.thirdPerson,
                    }
                  : {
                      firstPerson: chunkValue ?? "",
                      thirdPerson: "",
                    }
              );
            }
            if (!done2) {
              const { value: value2, done: doneReading2 } =
                await reader2.read();

              done2 = doneReading2;

              const chunkValue2 = decoder2.decode(value2);

              setAiResponse((prev) =>
                prev
                  ? {
                      firstPerson: prev.firstPerson,
                      thirdPerson: prev.thirdPerson + chunkValue2,
                    }
                  : {
                      firstPerson: "",
                      thirdPerson: chunkValue2 ?? "",
                    }
              );
            }
          }
        } else {
          console.error(res.status, res.statusText);
          setAiResponse({
            firstPerson:
              "Sorry, we couldn't analyze this question. Please try again later.",
            thirdPerson:
              "Sorry, we couldn't analyze this question. Please try again later.",
          });
          setIsLoadingAnalysis(false);
        }
      } catch (error) {
        setIsLoadingAnalysis(false);
        setAiResponse(null);
      }
    } else {
      setAiResponse(null);
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
      <motion.main
        layout
        className="flex flex-col items-center w-full min-h-screen pb-32"
      >
        <motion.div layout className="w-full flex justify-end px-8 py-4">
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </motion.div>
        <motion.div
          layout
          className="flex flex-col w-full px-8 max-w-6xl flex-grow items-center justify-center"
        >
          {!router.isFallback ? (
            <motion.div
              className="flex flex-col w-full items-center justify-center"
              layout
            >
              {pic && (
                <motion.div layout>
                  <Image
                    src={pic}
                    width={150}
                    height={150}
                    priority
                    quality={100}
                    className="rounded-full"
                    alt=""
                  />
                </motion.div>
              )}
              <motion.p
                layout
                className="mt-1 font-bold text-4xl"
              >{`@${username.replace("@", "")}`}</motion.p>
              <motion.p layout className="text-md mt-1">
                {name}
              </motion.p>
              <motion.input
                layout
                type="text"
                className="w-full max-w-xl mt-12 text-sm px-4 py-2 bg-black/10 rounded-full focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setAiResponse(null);
                    analyzeTweets(e.currentTarget.value);
                  }
                }}
              />
              {isLoadingAnalysis && (
                <div className="flex items-center mt-8 h-full justify-center">
                  <HashLoader size={50} />
                </div>
              )}
              {aiResponse && (
                <>
                  <motion.p layout className="w-full mt-12 font-bold text-lg">
                    {name}:
                  </motion.p>
                  <motion.p
                    layout="position"
                    className="whitespace-pre-wrap leading-5 w-full"
                  >
                    {aiResponse.firstPerson.trim()}
                  </motion.p>
                </>
              )}
              {aiResponse && (
                <>
                  <motion.p layout className="w-full mt-8 font-bold text-lg">
                    Meta Analysis:
                  </motion.p>
                  <motion.p
                    layout="position"
                    className="w-full whitespace-pre-wrap leading-5"
                  >
                    {aiResponse.thirdPerson.trim()}
                  </motion.p>
                </>
              )}
            </motion.div>
          ) : (
            <div className="flex items-center h-full justify-center">
              <HashLoader size={100} />
            </div>
          )}
        </motion.div>
      </motion.main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const username = context.params?.username as string | undefined;

  if (!username) {
    return {
      notFound: true,
    };
  }

  const { name, id, pic } = await getTwitterId(username);

  if (!id || !name) {
    return {
      props: {
        name: "Unknown",
        username,
        pic: null,
        result: "Failed to find user",
      },
      revalidate: false,
    };
  }

  //Get all tweets
  const tweets = await getTweetsFromUser(1, id, true, true);

  if (tweets.length == 0) {
    return {
      props: {
        name,
        username,
        pic,
        result: "Failed to retrieve tweets",
      },
      revalidate: 180,
    };
  }

  return {
    props: {
      name,
      username,
      pic: pic ?? null,
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
