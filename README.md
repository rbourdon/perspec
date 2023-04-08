## :warning: Twitter API changes killed this project

This is an experimental web app that uses GPT-3.5 to enable users to gauge twitter user opinions and community perspective as well as mock interview any twitter user.

To use it, deploy to vercel and create a .env.local file with the following environment variables:

TWITTER_API_KEY=
TWITTER_SECRET=
TWITTER_BEARER_TOKEN=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

Google is used for simple authentication so you don't accidently wrack up a big openai bill if you expose the app :)
