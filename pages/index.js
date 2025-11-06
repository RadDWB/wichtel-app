import { useState } from 'react';
import CreateGroup from '../components/CreateGroup';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [groupId, setGroupId] = useState(null);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>🎄 Wichteln Online</h1>
        <p className={styles.description}>
          Organisiere dein Wichteln in 3 Schritten – kostenlos, anonym & mit Wunschzettel!
        </p>

        {!groupId ? (
          <CreateGroup onGroupCreated={setGroupId} />
        ) : (
          <div className={styles.success}>
            <h3>Gruppe erstellt!</h3>
            <p>Teile diesen Link mit allen Teilnehmern:</p>
            <code className={styles.code}>
              {typeof window !== 'undefined' ? `${window.location.origin}/${groupId}` : ''}
            </code>
            <br />
            <a href={`/${groupId}`} className={styles.link}>Zur Gruppe →</a>
          </div>
        )}
      </main>
    </div>
  );
}