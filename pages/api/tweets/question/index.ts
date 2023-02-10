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
  if (searchTerms.length === 0) {
    res.status(500).json({
      status: "fail",
      message: "Failed to extract search terms.",
    });
    return;
  }

  //Search recent tweets for search terms
  const searchTweets = await getRecentTweetsBySearch(id, searchTerms);

  //Make tweet text
  const finalTweets = combineTweets(
    searchTweets.length === 0 ? tweets : searchTweets,
    searchTweets.length === 0 ? undefined : [tweets]
  );
  const tweetText = tweetsToTokenText(finalTweets, 3500);

  const answer = await answerQuestionAboutUser(
    name,
    username,
    tweetText,
    question
  );

  if (answer.length === 0) {
    res.status(500).json({
      status: "fail",
      message:
        "Failed to get analysis. Likey Open AI API is overloaded or too many requests. Please try again after a few minutes.",
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
