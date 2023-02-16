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
        temperature: 0.8,
        presence_penalty: 0.3,
        frequency_penalty: 0.1,
        max_tokens: 300,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text as string;
    } else {
      console.warn(res.status, res.statusText);
      return "Failed to get user analysis. Please check back later.";
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
        temperature: 0.5,
        presence_penalty: 0.3,
        frequency_penalty: 0.1,
        max_tokens: 300,
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.choices[0].text;
    } else {
      console.warn(res.status, res.statusText);
      return "Failed to get user analysis. Please check back later.";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}
