import { Client } from "twitter-api-sdk";
export async function getTwitterId(username: string) {
  const client = new Client(process.env.TWITTER_BEARER_TOKEN!);
  try {
    const parsedName = username.replace("@", "");
    const idResponse = await client.users.findUserByUsername(parsedName, {
      "user.fields": ["profile_image_url"],
    });

    return {
      id: idResponse.data?.id,
      name: idResponse.data?.name,
      pic: idResponse.data?.profile_image_url?.replace("_normal", ""),
    };
  } catch (e) {
    console.error(e);
    return { id: null, name: null, pic: null };
  }
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
    console.error(e);
    return [];
  }
}

export async function getRecentTweetsToUser(id: string, username: string) {
  try {
    const client = new Client(process.env.TWITTER_BEARER_TOKEN!);
    const tweets = await client.tweets.tweetsRecentSearch({
      query: `to:${id} OR @${username} -is:retweet`,
      max_results: 100,
    });

    return (
      tweets.data?.map((tweet) => ({
        id: tweet.id,
        text: tweet.text.replaceAll(`@${username}`, ""),
      })) ?? []
    );
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function getTweetsFromUser(
  count: 1 | 2 | 3,
  id: string,
  ignoreRetweets: boolean,
  ignoreReplies: boolean,
  until?: string
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
    next_token?: string;
  }[] = [];

  try {
    const set1 = await client.tweets.usersIdTweets(id, {
      max_results: 100,
      exclude: exclude,
      until_id: until,
    });
    tweetBatches.push({
      tweets:
        set1.data?.map((tweet) => ({
          id: tweet.id,
          text: tweet.text,
        })) ?? [],
      next_token: set1.meta?.next_token,
    });
    if (count > 1 && tweetBatches[0].next_token) {
      const set2 = await client.tweets.usersIdTweets(id, {
        max_results: 100,
        exclude: exclude,
        pagination_token: tweetBatches[0].next_token,
      });
      tweetBatches.push({
        tweets:
          set2.data?.map((tweet) => ({
            id: tweet.id,
            text: tweet.text,
          })) ?? [],
        next_token: set2.meta?.next_token,
      });
    }
    if (count > 2 && tweetBatches[1].next_token) {
      const set3 = await client.tweets.usersIdTweets(id, {
        max_results: 100,
        exclude: exclude,
        pagination_token: tweetBatches[1].next_token,
      });
      tweetBatches.push({
        tweets:
          set3.data?.map((tweet) => ({
            id: tweet.id,
            text: tweet.text,
          })) ?? [],
        next_token: set3.meta?.next_token,
      });
    }

    const tweets = tweetBatches.map((batch) => batch.tweets).flat();

    return tweets;
  } catch (e) {
    console.error(e);
    return [];
  }
}
