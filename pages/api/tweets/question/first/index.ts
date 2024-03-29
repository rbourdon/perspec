import {
  answerQuestionAsUser,
  getSearchTermsByQuestion,
  convertToSecond,
  determineQuestionPerspective,
} from "@/lib/utils/openai";
import {
  getRecentTweetsBySearch,
  getTweetsFromUser,
  getTwitterId,
} from "@/lib/utils/twitter";
import { tweetsToTokenText, combineTweets } from "@/lib/utils";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const { question, username, tweets } = (await req.json()) as {
    username: string | null | undefined;
    question: string | null | undefined;
    tweets: { id: string; text: string }[] | null | undefined;
  };

  //Return error if missing env vars
  if (!process.env.TWITTER_BEARER_TOKEN || !process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        status: "fail",
        message: "Environment Configuration Error",
        data: {
          analysis: "Environment Configuration Error",
        },
      }),
      { status: 500 }
    );
  }

  if (!username || !question || !tweets) {
    return new Response(
      JSON.stringify({
        status: "fail",
        message: "Missing required parameters",
        data: {
          analysis: "Missing required parameters",
        },
      }),
      { status: 500 }
    );
  }

  const { id, name } = await getTwitterId(username);

  if (!id || !name) {
    return new Response(
      JSON.stringify({ status: "fail", message: "Invalid user" }),
      { status: 500 }
    );
  }

  if (!tweets) {
    return new Response(
      JSON.stringify({ status: "fail", message: "Please provide tweets" }),
      { status: 500 }
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
      }),
      { status: 500 }
    );
  }

  //Search recent tweets for search terms
  const searchTweets = await getRecentTweetsBySearch(id, searchTerms);

  //Make tweet text
  const finalTweets = combineTweets(
    !searchTweets || searchTweets.length === 0 ? tweets : searchTweets,
    !searchTweets || searchTweets.length === 0
      ? [
          await getTweetsFromUser(
            1,
            id,
            true,
            true,
            tweets.reduce((prev, curr) =>
              parseInt(curr.id) < parseInt(prev.id) ? curr : prev
            ).id
          ),
        ]
      : [tweets]
  );

  const tweetText = tweetsToTokenText(finalTweets, 3400);

  const perspective = await determineQuestionPerspective(question);

  if (perspective.toLowerCase() !== "second") {
    const secondPersonQuestion = await convertToSecond(question);

    const answer = await answerQuestionAsUser(
      name,
      username,
      tweetText,
      secondPersonQuestion,
      true,
      true
    );

    return new Response(answer as ReadableStream, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/event-stream;charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } else {
    const answer = await answerQuestionAsUser(
      name,
      username,
      tweetText,
      question,
      true,
      true
    );

    return new Response(answer as ReadableStream, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "text/event-stream;charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  }
}
