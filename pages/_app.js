// pages/_app.js
import '../styles/globals.css';
import '../styles/Home.module.css'; // Optional: Falls du Module-CSS brauchst

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
