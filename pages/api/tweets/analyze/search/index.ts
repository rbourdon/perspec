import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { Client } from "twitter-api-sdk";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { question, username, tweets } = JSON.parse(req.body) as {
    username: string | null | undefined;
    question: string | null | undefined;
    tweets: { id: string; text: string }[] | null | undefined;
  };
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ status: "fail", message: "You must be logged in." });
    return;
  }

  const { Configuration, OpenAIApi } = require("openai");
  const { encode, decode } = require("gpt-3-encoder");
  //Return erro if missing env vars
  if (
    !process.env.TWITTER_BEARER_TOKEN ||
    !process.env.OPENAI_API_KEY ||
    !username ||
    !question
  ) {
    res
      .status(500)
      .json({ status: "fail", message: "Environment Configuration Error" });
    return;
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  const client = new Client(process.env.TWITTER_BEARER_TOKEN);

  const idResponse = await client.users.findUserByUsername(username);

  if (!idResponse.data?.id || !idResponse.data?.name) {
    res.status(500).json({ status: "fail", message: "Invalid user" });
    return;
  }
  const realName = idResponse.data.name;

  //Search for key words from question
  const searchTerms: string[] = [];
  try {
    const response = await openai.createCompletion({
      model: "text-curie-001",
      prompt: `List several search terms, separated by commas, from this question: ${question}`,
      temperature: 0.5,
      max_tokens: 50,
    });

    searchTerms.push(
      response.data.choices[0].text
        .split(",")
        .map((term: string) => `"${term.trim()}"`)
        .join(" OR ")
    );
  } catch (e) {
    res.status(200).json({
      status: "fail",
      data: {
        analysis: `Failed to get search terms from question. Exceeding API limits.`,
      },
    });
    return;
  }

  //Search recent tweets for search terms
  const tweets1 = await client.tweets.tweetsRecentSearch({
    query: `from:${idResponse.data?.id} (${searchTerms[0]})`,
    max_results: 100,
  });
  console.log(`from:${idResponse.data?.id} (${searchTerms[0]})`);

  //Make tweet text
  if (!tweets1?.data && !tweets) {
    res.status(500).json({ status: "fail", message: "Failed to load tweets" });
    return;
  }

  const finalTweets = [
    ...(tweets1?.data ? tweets1.data : []),
    ...(tweets
      ? tweets.filter((tweet) =>
          tweets1?.data
            ? !tweets1.data.map((t) => t.id).includes(tweet.id)
            : true
        )
      : []),
  ];
  const tweetTextRaw = finalTweets
    .map((tweet) => tweet.text)
    .filter((text) => text.split(" ").length > 6)
    .join(" ")
    .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "")
    .replaceAll("\n", " ")
    .replaceAll("  ", " ");
  console.log(tweets1, tweetTextRaw);
  const encoded = encode(tweetTextRaw);
  const tweetText = decode(encoded.slice(0, 3500));

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Answer the provided question about a user, given their name and text of their tweets. Explain your answer in detail and speculate if you can't determine an answer.\nName:${realName}\nTweets: ${tweetText}.\nQuestion: ${question}\nAnswer:`,
      temperature: 0.85,
      max_tokens: 300,
    });
    if (response.status === 429) {
      res.status(500).json({
        status: "fail",
        message: "Failed to get analysis. Too many requests.",
      });
      return;
    }

    res.status(200).json({
      status: "success",
      data: { analysis: response.data.choices[0].text },
    });
    return;
  } catch (e) {
    res.status(200).json({
      status: "fail",
      data: {
        analysis: `Failed to generate response. Exceeding API limits.`,
      },
    });
    return;
  }
}
