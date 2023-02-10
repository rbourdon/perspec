import { Client } from "twitter-api-sdk";

export async function getTwitterId(username: string) {
  const client = new Client(process.env.TWITTER_BEARER_TOKEN!);
  const idResponse = await client.users.findUserByUsername(username);

  return { id: idResponse.data?.id, name: idResponse.data?.name };
}

export async function getRecentTweetsBySearch(
  id: string,
  searchString: string
) {
  try {
    const client = new Client(process.env.TWITTER_BEARER_TOKEN!);
    const tweets = await client.tweets.tweetsRecentSearch({
      query: `from:${id} (${searchString})`,
      max_results: 100,
    });
    return (
      tweets.data?.map((tweet) => ({ id: tweet.id, text: tweet.text })) ?? []
    );
  } catch (e) {
    return [];
  }
}

export async function getSearchTermsByQuestion(question: string) {
  const { Configuration, OpenAIApi } = require("openai");

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-curie-001",
      prompt: `List several search terms, separated by commas, from this question: ${question}`,
      temperature: 0.5,
      max_tokens: 50,
    });

    return response.data.choices[0].text
      .split(",")
      .map((term: string) => `"${term.trim()}"`)
      .join(" OR ");
  } catch (e) {
    return "";
  }
}

export async function answerQuestionAboutUser(
  name: string,
  username: string,
  tweetText: string,
  question: string
) {
  const { Configuration, OpenAIApi } = require("openai");

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Answer the provided question about a user, given their name, online handle, and text of their tweets. Explain your answer in detail and speculate if you can't determine an answer.\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}.\nQuestion: ${question}\nAnswer:`,
      temperature: 0.85,
      max_tokens: 300,
    });
    if (response.status === 429) {
      return "";
    }

    return response.data.choices[0].text;
  } catch (e) {
    return "";
  }
}

export async function analyzeUser(
  name: string,
  username: string,
  tweetText: string
) {
  const { Configuration, OpenAIApi } = require("openai");

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Provided a person's tweets, their handle, and their real name, act as a psychologist and describe the person in detail. Be specific and include a list of some of their personal values, interests and history.\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}.\nAnalysis:`,
      temperature: 0.75,
      max_tokens: 420,
    });
    if (response.status === 429) {
      return "";
    }

    return response.data.choices[0].text;
  } catch (e) {
    return "";
  }
}

export function combineTweets(
  primaryTweets: {
    id: string;
    text: string;
  }[],
  additionalTweets?: {
    id: string;
    text: string;
  }[][]
) {
  return [
    ...primaryTweets,
    ...(additionalTweets
      ? additionalTweets
          .map((aTweets) =>
            aTweets.filter(
              (tweet) => !primaryTweets.map((t) => t.id).includes(tweet.id)
            )
          )
          .flat()
      : []),
  ];
}

export function tweetsToTokenText(
  tweets: {
    id: string;
    text: string;
  }[],
  tokenLimit: number
) {
  const { encode, decode } = require("gpt-3-encoder");
  const tweetTextRaw = tweets
    .map((tweet) => tweet.text)
    .filter((text) => text.split(" ").length > 6)
    .join(" ")
    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "")
    .replaceAll("\n", " ")
    .replaceAll("  ", " ");

  const encoded = encode(tweetTextRaw);
  const tweetText = decode(encoded.slice(0, tokenLimit));
  return tweetText;
}

export async function getTweets(
  count: number,
  id: string,
  ignoreRetweets: boolean,
  ignoreReplies: boolean
) {
  const client = new Client(process.env.TWITTER_BEARER_TOKEN!);
  const exclude: ("retweets" | "replies")[] = [];
  if (ignoreRetweets) {
    exclude.push("retweets");
  }
  if (ignoreReplies) {
    exclude.push("replies");
  }

  const tweetBatches: {
    tweets: { id: string; text: string }[];
    oldest_id?: string;
  }[] = [];
  try {
    await Promise.all(
      Array(count)
        .fill(0)
        .map(async (_, i) => {
          const someTweets = await client.tweets.usersIdTweets(
            id,
            i > 0 && tweetBatches[i - 1]?.oldest_id
              ? {
                  until_id: tweetBatches[i - 1]?.oldest_id,
                  max_results: 100,
                  exclude: exclude,
                }
              : {
                  max_results: 100,
                  exclude: exclude,
                }
          );
          if (someTweets.data) {
            tweetBatches.push({
              tweets: someTweets.data.map((tweet) => ({
                id: tweet.id,
                text: tweet.text,
              })),
              ...(someTweets.meta?.oldest_id && {
                oldest_id: someTweets.meta.oldest_id,
              }),
            });
          }
          return someTweets;
        })
    );
    const tweets = tweetBatches.map((batch) => batch.tweets).flat();

    return tweets;
  } catch (e) {
    return [];
  }
}
