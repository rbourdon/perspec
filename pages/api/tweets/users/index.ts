import { NextRequest } from "next/server";
import { getTwitterUsers } from "@/lib/utils";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  const { query } = (await req.json()) as {
    query: string | null | undefined;
  };

  //Return error if missing env vars
  if (!process.env.TWITTER_BEARER_TOKEN) {
    return new Response(
      JSON.stringify({
        status: "fail",
        message: "Environment Configuration Error",
        data: {
          analysis: "Environment Configuration Error",
        },
      })
    );
  }

  if (!query) {
    return new Response(
      JSON.stringify({
        status: "fail",
        message: "Missing required parameters",
        data: {
          analysis: "Missing required parameters",
        },
      })
    );
  }

  const users = await getTwitterUsers(query);

  if (users.length === 0) {
    return new Response(
      JSON.stringify({ status: "fail", message: "Failed to find any users" })
    );
  }

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Successfully fetched users.",
      data: { users },
    })
  );
}
