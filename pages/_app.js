// pages/_app.js
import '../styles/globals.css';
import '../styles/Home.module.css'; // Optional, falls du es brauchst

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;