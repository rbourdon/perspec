import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <>
      <Head>
        <title>Perspec</title>
        <meta name="description" content="Perspec alpha" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center items-center min-h-screen">
        <div>
          <p>{`Get started by going to /{username}`}</p>
        </div>
      </main>
    </>
  );
}
