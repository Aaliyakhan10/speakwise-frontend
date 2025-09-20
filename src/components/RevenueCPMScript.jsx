import React, { useEffect } from "react";

function RevenueCPMScript() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://pubertytechnicallyknowhow.com/e368d2dd8e67a7337067d7719385532e/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    document.body.appendChild(script);

    // Cleanup script on unmount
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="container-e368d2dd8e67a7337067d7719385532e"></div>;
}

export default RevenueCPMScript;


{/* <script async="async" data-cfasync="false" src="//pubertytechnicallyknowhow.com/e368d2dd8e67a7337067d7719385532e/invoke.js"></script>
<div id="container-e368d2dd8e67a7337067d7719385532e"></div> */}