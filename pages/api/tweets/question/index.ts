import { NextRequest, NextResponse } from "next/server";
//import { getServerSession } from "next-auth/next";
//import { authOptions } from "@/pages/api/auth/[...nextauth]";
import {
  answerQuestionAboutUser,
  combineTweets,
  getRecentTweetsBySearch,
  getSearchTermsByQuestion,
  getTwitterId,
  tweetsToTokenText,
} from "@/lib/utils";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const { question, username, tweets } = (await req.json()) as {
    username: string | null | undefined;
    question: string | null | undefined;
    tweets: { id: string; text: string }[] | null | undefined;
  };

  //Return error if missing env vars
  if (
    !process.env.TWITTER_BEARER_TOKEN ||
    !process.env.OPENAI_API_KEY ||
    !username ||
    !question ||
    !tweets
  ) {
    return new Response(
      JSON.stringify({
        status: "fail",
        message: "Environment Configuration Error",
      })
    );
  }

  const { id, name } = await getTwitterId(username);

  if (!id || !name) {
    return new Response(
      JSON.stringify({ status: "fail", message: "Invalid user" })
    );
  }

  if (!tweets) {
    return new Response(
      JSON.stringify({ status: "fail", message: "Please provide tweets" })
    );
  }

  //Search for key words from question
  const searchTerms: string = await getSearchTermsByQuestion(question);

  if (searchTerms.length === 0) {
    return new Response(
      JSON.stringify({
        status: "fail",
        message: "Failed to extract search terms.",
        data: {
          analysis: "Failed to extract search terms.",
        },
      })
    );
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
    return new Response(
      JSON.stringify({
        status: "fail",
        message:
          "Failed to get analysis. Likey Open AI API is overloaded or too many requests. Please try again after a few minutes.",
        data: {
          analysis:
            "Failed to get analysis. Likey Open AI API is overloaded or too many requests. Please try again after a few minutes.",
        },
      })
    );
  }
  return new Response(
    JSON.stringify({
      status: "success",
      data: { analysis: answer },
    })
  );
}
