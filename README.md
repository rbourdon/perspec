## :warning: Twitter API changes killed this project

This is an experimental web app that uses GPT-3.5 to enable users to gauge twitter user opinions and community perspective as well as mock interview any twitter user.

<p align="center">
<img src="https://user-images.githubusercontent.com/3112707/230728749-cc1982f3-9459-4ad5-97a3-9ae65a33284d.png" width="75%">
<img src="https://user-images.githubusercontent.com/3112707/230728758-379db9ae-2bff-490a-b62f-42c9e455aa72.png" width="75%">
</p>

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
