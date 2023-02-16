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
  tweets:
    | {
        id: string;
        text: string;
      }[]
    | undefined
    | null,
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
      .filter((t) => t.length > 0 && t !== "-")
      .join(" ") ?? "";

  return tweetText.slice(0, tokenLimit * 4).trim();
}
