"use client";

import dynamic from "next/dynamic";
import Head from "next/head";

// Dynamically import the PhaserGame component with SSR disabled
const PhaserGameNoSSR = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false, // Ensure this component only renders on the client side
});

export default function Home() {
  return (
    <div className="p-8 flex flex-col items-center">
      <Head>
        <title>食物消消乐 - Food Sticker Fiesta</title>
      </Head>
      <h1 className="text-3xl font-bold mb-6">Food Sticker Fiesta</h1>
      
      {/* The game will be exactly 800x600 */}
      <PhaserGameNoSSR />
      
      <p className="mt-4 text-sm text-gray-500">
        Game rendering area above (800x600).
      </p>
    </div>
  );
}
