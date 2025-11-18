// pages/_app.js
import Head from 'next/head';
import '../styles/globals.css';
import '../styles/Home.module.css'; // Optional: Falls du Module-CSS brauchst

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
