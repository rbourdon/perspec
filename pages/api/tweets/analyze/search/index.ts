import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  answerQuestionAboutUser,
  combineTweets,
  getRecentTweetsBySearch,
  getSearchTermsByQuestion,
  getTwitterId,
  tweetsToTokenText,
} from "@/lib/utils";

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

  //Return erro if missing env vars
  if (
    !process.env.TWITTER_BEARER_TOKEN ||
    !process.env.OPENAI_API_KEY ||
    !username ||
    !question ||
    !tweets
  ) {
    res
      .status(500)
      .json({ status: "fail", message: "Environment Configuration Error" });
    return;
  }

  const { id, name } = await getTwitterId(username);

  if (!id || !name) {
    res.status(500).json({ status: "fail", message: "Invalid user" });
    return;
  }

  if (!tweets) {
    res.status(500).json({ status: "fail", message: "Please provide tweets" });
    return;
  }

  //Search for key words from question
  const searchTerms: string = await getSearchTermsByQuestion(question);

  //Search recent tweets for search terms
  const tweets1 = await getRecentTweetsBySearch(id, searchTerms);

  //Make tweet text

  const finalTweets = combineTweets(tweets1, [tweets]);
  const tweetText = tweetsToTokenText(finalTweets, 3500);

  const answer = await answerQuestionAboutUser(
    name,
    username,
    tweetText,
    question
  );

  if (!answer || answer.length <= 10) {
    res.status(500).json({
      status: "fail",
      message: "Failed to get analysis. Too many requests.",
    });
    return;
  } else {
    res.status(200).json({
      status: "success",
      data: { analysis: answer },
    });
    return;
  }
}
