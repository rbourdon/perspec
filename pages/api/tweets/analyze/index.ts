import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { tweetText, question } = JSON.parse(req.body) as {
    tweetText: string | null | undefined;
    question: string | null | undefined;
  };
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    res.status(401).json({ status: "fail", message: "You must be logged in." });
    return;
  }

  const { Configuration, OpenAIApi } = require("openai");
  //Return error if missing env vars
  if (!process.env.OPENAI_API_KEY || !tweetText) {
    res
      .status(500)
      .json({ status: "fail", message: "Environment Configuration Error" });
    return;
  }

  if (!tweetText || !question) {
    res
      .status(500)
      .json({ status: "fail", message: "Please provide tweets to analyze" });
    return;
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Provided some tweets, and the question about the user.\nTweets: ${tweetText}.\nQuestion: ${question}\nAnswer:`,
      temperature: 0.75,
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
    res.status(500).json({
      status: "fail",
      message: `Failed to generate response. Error: ${e}`,
    });
    return;
  }
}
