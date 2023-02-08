// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Client } from "twitter-api-sdk";
const client = new Client(process.env.TWITTER_BEARER_TOKEN);

type Data = {
  name: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const tweets = await client.tweets.usersIdTweets("rbourdon");
  res.status(200).json({ name: "John Doe" });
}
