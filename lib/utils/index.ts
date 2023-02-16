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

export async function getTwitterUsers(query: string) {
  const parsedName = query.replace("@", "");

  try {
    const res = await fetch(
      `https://api.twitter.com/1.1/users/search.json?q=${parsedName}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      }
    );

    const json = await res.json();

    return json;
  } catch (e) {
    console.error(e);
    return "";
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

export async function convertToThird(question: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/edits", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-davinci-edit-001",
        input: question,
        instruction: `Convert this question to a third person question.`,
        temperature: 0.1,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      return "";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function convertToSecond(question: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/edits", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-davinci-edit-001",
        input: question,
        instruction: `Convert this question to a second person question.`,
        temperature: 0.1,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      return "";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function getSearchTermsByQuestion(question: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-curie-001",
        prompt: `List several search terms, separated by commas, based on the following question.\n\nQuestion: ${question}\n\nSearch Terms:`,
        temperature: 0.2,
        max_tokens: 50,
        best_of: 2,
      }),
    });
    if (res.ok) {
      const json = await res.json();

      return json.choices[0].text
        .replaceAll("\n\n", ",")
        .replaceAll("\n", ",")
        .replaceAll(",,", ",")
        .replaceAll('"', "")
        .split(",")
        .filter((term: string) => term.length > 1)
        .map((term: string) => `"${term.trim()}"`)
        .join(" OR ");
    } else {
      return "";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function answerQuestionAboutUser(
  name: string,
  username: string,
  tweetText: string,
  question: string
) {
  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `Read the following user details, including real name and tweets, and then answer the following question about the user in the tone of a psychologist. Explain your answer. If it isn't possible to answer based on the tweets, you should speculate.\n\n"""\nName: ${name}\nTweets: ${tweetText}.\n"""\n\nQuestion: ${question}\n\nAnswer:`,
        temperature: 0.4,
        max_tokens: 200,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      return "";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function answerQuestionAsUser(
  name: string,
  username: string,
  tweetText: string,
  question: string
) {
  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `"""\n${tweetText}\n"""\n\nThe above text is a list of tweets made by ${name}. Using the tweets, pretend to be this person and answer the following question in their speaking style and language.\n\nQuestion: ${question}\n\nAnswer:`,
        temperature: 0.6,
        max_tokens: 150,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      return "";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function analyzeUser(
  name: string,
  username: string,
  tweetText: string
) {
  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `Provided a person's tweets, their handle, and their real name, act as a psychologist and describe the person. Make sure to talk about both their success and failures. Be specific and speculate.\n\n"""\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}.\n"""\n\nAnalysis:`,
        temperature: 1,
        presence_penalty: 0.3,
        frequency_penalty: 0.1,
        max_tokens: 350,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      console.log(res.status, res.statusText);
      return "Failed to get user analysis";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function analyzeUserCommunityView(
  name: string,
  username: string,
  tweetText: string
) {
  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-davinci-003",
        prompt: `Provided tweets directed at a person, their handle, and their real name, describe how people see the person. Be specific and speculate.\n\n"""\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}.\n"""\n\nAnalysis:`,
        temperature: 1,
        presence_penalty: 0.3,
        frequency_penalty: 0.1,
        max_tokens: 350,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      console.log(res.status, res.statusText);
      return "Failed to get user analysis";
    }
  } catch (e) {
    console.error(e);
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
  const tweetText =
    tweets
      ?.map((tweet) =>
        tweet.text
          .replace(/(?:https?|ftp):\/\/[\n\S]+/g, "")
          .replace(new RegExp("[\u1000-\uFFFF]+", "g"), "")
          .replaceAll("�", "")
          .replaceAll("  ", " ")
          .replaceAll("\n\n", "\n")
          .trim()
      )
      .filter((text) => text.split(" ").length > 5)
      .map((text) => (text[0] === "-" ? text.slice(1) : text))
      .join("\n")
      .split(" ")
      .slice(0, tokenLimit * 0.75) ?? [];

  return tweetText.join(" ");
}

export async function getRecentTweetsToUser(id: string, username: string) {
  try {
    const client = new Client(process.env.TWITTER_BEARER_TOKEN!);
    const tweets = await client.tweets.tweetsRecentSearch({
      query: `to:${id} OR @${username}`,
      max_results: 100,
    });
    client.tweets;

    return (
      tweets.data?.map((tweet) => ({ id: tweet.id, text: tweet.text })) ?? []
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
    next_token?: string;
  }[] = [];

  try {
    const set1 = await client.tweets.usersIdTweets(id, {
      max_results: 100,
      exclude: exclude,
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
