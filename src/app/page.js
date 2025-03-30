"use client";

import dynamic from "next/dynamic";
import Head from "next/head";
import { useEffect, useState } from "react";

// Dynamically import the PhaserGame component with SSR disabled
const PhaserGameNoSSR = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false, // Ensure this component only renders on the client side
});

export default function Home() {
  const [viewportHeight, setViewportHeight] = useState(0);
  
  useEffect(() => {
    setViewportHeight(window.innerHeight);
    
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col items-center" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Head>
        <title>食物消消乐 - Food Sticker Fiesta</title>
      </Head>
      
      {/* Game takes full available space with horizontal scrolling if needed */}
      <div className="overflow-auto w-full h-full" style={{ overscrollBehavior: 'none' }}>
        <PhaserGameNoSSR />
      </div>
      
      {/* Info line showing resolution */}
      <p className="text-xs text-gray-400 absolute bottom-1">
        2560x{viewportHeight} (2K)
      </p>
    </div>
  );
}
