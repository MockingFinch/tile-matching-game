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
  const [viewportWidth, setViewportWidth] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // This code only runs on the client after the component mounts
    setIsClient(true);
    setViewportHeight(window.innerHeight);
    setViewportWidth(window.innerWidth);
    
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setViewportWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col items-center" 
         style={{ 
           height: '100vh', 
           width: '100vw', 
           overflow: 'hidden',
           background: 'linear-gradient(to bottom right, #ffe6f2, #e6f7ff)',
           margin: 0,
           padding: 0
         }}>
      <Head>
        <title>食物消消乐 - Food Sticker Fiesta</title>
      </Head>
      
      {/* Game takes full available space */}
      <div className="w-full h-full" 
           style={{ 
             overscrollBehavior: 'none',
             overflow: 'hidden'
           }}>
        <PhaserGameNoSSR />
      </div>
      
      {/* Only show resolution info when on client-side */}
      {isClient && (
        <p className="text-xs text-pink-400 absolute bottom-1 right-2 z-10">
          {viewportWidth}x{viewportHeight}
        </p>
      )}
    </div>
  );
}
