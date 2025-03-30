"use client";

import dynamic from "next/dynamic";
import Head from "next/head";
import { useEffect, useState } from "react";

// Dynamically import the PhaserGame component with SSR disabled
const PhaserGameNoSSR = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false,
});

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    // Prevent unwanted behaviors on mobile
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch-zoom
      }
    }, { passive: false });
    
    // Try to lock orientation with better feature detection
    const tryOrientationLock = async () => {
      // Most robust feature detection
      if (typeof window !== 'undefined' && 
          window.screen && 
          window.screen.orientation && 
          typeof window.screen.orientation.lock === 'function') {
        try {
          await window.screen.orientation.lock('portrait');
          console.log('Orientation locked to portrait');
        } catch (error) {
          // Silently fail - don't log errors as this is expected on many devices
        }
      } else {
        // Alternative approach for devices without orientation API
        // Just use CSS and messaging to encourage portrait orientation
        const orientationHandler = () => {
          const isPortrait = window.innerHeight > window.innerWidth;
          const orientationMessage = document.getElementById('orientation-message');
          
          if (!isPortrait && orientationMessage) {
            orientationMessage.style.display = 'flex';
          } else if (orientationMessage) {
            orientationMessage.style.display = 'none';
          }
        };
        
        window.addEventListener('resize', orientationHandler);
        orientationHandler(); // Check initial orientation
        
        return () => window.removeEventListener('resize', orientationHandler);
      }
    };
    
    tryOrientationLock();
    
    return () => {
      document.removeEventListener('touchmove', () => {});
    };
  }, []);

  return (
    <div className="flex flex-col items-center" 
         style={{ 
           height: '100vh', 
           width: '100vw', 
           overflow: 'hidden',
           background: 'linear-gradient(to bottom, #ffe6f2, #e6f7ff)',
           margin: 0,
           padding: 0,
           touchAction: 'manipulation', // Disable double-tap zoom
           WebkitTapHighlightColor: 'transparent', // Remove tap highlight
           WebkitTouchCallout: 'none', // Disable callout
           WebkitUserSelect: 'none', // Disable selection
           userSelect: 'none'
         }}>
      <Head>
        <title>食物消消乐 - Food Sticker Fiesta</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      
      <div className="w-full h-full" 
           style={{ 
             overscrollBehavior: 'none',
             overflow: 'hidden'
           }}>
        <PhaserGameNoSSR />
      </div>
      
      {/* Mobile instructions overlay - appears briefly on start */}
      {isClient && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-pink-100 bg-opacity-80 z-20"
             id="instructions"
             style={{
               opacity: 1,
               transition: 'opacity 1s ease-in-out',
               animation: 'fadeInOut 3s forwards'
             }}>
          <div className="text-center p-6 rounded-xl bg-white bg-opacity-90 shadow-lg">
            <h2 className="text-2xl font-bold text-pink-600 mb-3">✨ 食物消消乐 ✨</h2>
            <p className="text-lg mb-2">👆 点击交换相邻食物</p>
            <p className="text-lg mb-2">🔄 匹配3个或更多相同食物</p>
            <p className="text-lg">👍 竖直握住手机获得最佳体验</p>
          </div>
        </div>
      )}
      
      {/* Orientation warning (shows only in landscape) */}
      <div id="orientation-message" 
           className="absolute inset-0 hidden flex-col items-center justify-center bg-pink-600 bg-opacity-90 z-30"
           style={{ display: 'none' }}>
        <div className="text-center p-8 rounded-xl bg-white">
          <h2 className="text-2xl font-bold text-pink-600 mb-4">请旋转设备</h2>
          <div className="text-5xl mb-4">📱↻</div>
          <p className="text-lg">竖直握住手机获得最佳游戏体验</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
      `}</style>
    </div>
  );
}
