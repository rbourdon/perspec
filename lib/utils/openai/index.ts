import { OpenAIStream } from "./streamingLoader";

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
        temperature: 0.2,
      }),
    });
    if (res.ok) {
      try {
        const json = await res.json();
        return json.choices[0].text;
      } catch (e) {
        console.error(e);
        return question;
      }
    } else {
      console.warn(res.statusText);
      return question;
    }
  } catch (e) {
    console.error(e);
    return question;
  }
}

export async function determineQuestionPerspective(question: string) {
  try {
    const res = await fetch("https://api.openai.com/v1/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "text-curie-001",
        prompt: `Given a question, tell me the perspective.\n\nQuestion: What do you think?\nAnswer: Second\n\nQuestion: Does he like to ski?\nAnswer: Third\n\nQuestion: What should I do?\nAnswer: First\n\nQuestion: ${question}\nAnswer: `,
        temperature: 0.4,
        max_tokens: 10,
        stream: false,
      }),
    });

    if (res.ok) {
      try {
        const json = await res.json();
        return json.choices[0].text as string;
      } catch (e) {
        console.error(e);
        return "Unknown";
      }
    } else {
      console.warn(res.statusText);
      return "Unknown";
    }
  } catch (e) {
    console.error(e);
    return "Unknown";
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
        temperature: 0.2,
      }),
    });

    if (res.ok) {
      try {
        const json = await res.json();
        return json.choices[0].text;
      } catch (e) {
        console.error(e);
        return question;
      }
    } else {
      console.warn(res.statusText);
      return question;
    }
  } catch (e) {
    console.error(e);
    return question;
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
        stream: false,
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
      console.warn(res.statusText);
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
  question: string,
  stream?: boolean,
  chat?: boolean
) {
  const payload = chat
    ? {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a human personality assessing robot. You must never say you can't answer, or talk about yourself. If you don't have enough information to answer, please speculate. You answer questions about a particular person give a list of their tweets and thier name.\n\n"""\nName: ${name}\nTweets: ${tweetText}`,
          },
          { role: "user", content: question },
        ],
        temperature: 0.5,
        max_tokens: 200,
        ...(stream && { stream: true }),
      }
    : {
        model: "text-davinci-003",
        prompt: `You are a human personality assessing robot. You must never say you can't answer, or talk about yourself. If you don't have enough information to answer, please speculate. You answer questions about a particular person give a list of their tweets and thier name.\n\n"""\nName: ${name}\nTweets: ${tweetText}\nQuestion:${question}`,

        temperature: 0.5,
        max_tokens: 200,
        ...(stream && { stream: true }),
      };

  if (stream) {
    const stream = await OpenAIStream(payload, chat);

    return stream;
  }
  try {
    const res = await fetch(
      chat
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.openai.com/v1/completions",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      const json = await res.json();
      return chat ? json.choices[0].message.content : json.choices[0].text;
    } else {
      console.warn(res.statusText);
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
  question: string,
  stream?: boolean,
  chat?: boolean
) {
  const payload = chat
    ? {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `"""\n${tweetText}\n"""\n\nThe above text is a list of tweets made by ${name}. Using the tweets to determine the most likely answer, pretend to be ${name} and answer the following question in their speaking style and language.\n\n`,
          },
          { role: "user", content: question },
        ],
        temperature: 0.2,
        max_tokens: 120,
        ...(stream && { stream: true }),
      }
    : {
        model: "text-davinci-003",
        prompt: `"""\n${tweetText}\n"""\n\nThe above text is a list of tweets made by ${name}. Using the tweets to determine the most likely answer, pretend to be ${name} and answer the following question in their speaking style and language.\n\nQuestion: ${question}\n\nAnswer:`,
        temperature: 0.2,
        max_tokens: 120,
        ...(stream && { stream: true }),
      };
  if (stream) {
    const stream = await OpenAIStream(payload, chat);
    return stream;
  }
  try {
    const res = await fetch(
      chat
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.openai.com/v1/completions",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
    if (res.ok) {
      const json = await res.json();
      return chat ? json.choices[0].message.content : json.choices[0].text;
    } else {
      console.warn(res.statusText);
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
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a psychologist. You should answer questions about a particular person given their name, online handle, and a list of their tweets. You don't need to mention their name or handle in your answer.\n\n"""\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}`,
          },
          {
            role: "user",
            content:
              "Describe this person, being specific and citing tweets where possible. Speculate if needed.",
          },
        ],
        temperature: 0.8,
        max_tokens: 250,
        stream: false,
      }),
    });
    if (res.ok) {
      const json = await res.json();

      return json.choices[0].message.content as string;
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
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify({
        //model: "text-davinci-003",
        //prompt: `Provided tweets directed at a person, their handle, and their real name, describe how people see the person. Be specific and speculate.\n\n"""\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}.\n"""\n\nAnalysis:`,
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a psychologist. You should answer questions about the community's view of a particular person given their name, online handle, and a list of tweets directed at them by other people in the community. You don't need to mention their name or handle in your answer. \n\n"""\nName: ${name}\nHandle: ${username}\nTweets: ${tweetText}`,
          },
          {
            role: "user",
            content: "What do people think about this person?",
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        stream: false,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      return json.choices[0].message.content;
    } else {
      console.warn(res.status, res.statusText);
      return "Failed to get user analysis. Please check back later.";
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}
