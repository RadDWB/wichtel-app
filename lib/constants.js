export const APP_VERSION = 'devX3 02_12_25';

// Generate invitation text based on group's surprise mode
export const getInvitationText = (participantLink, group) => {
  const isMutualMode = group?.settings?.surpriseMode === 'mutual';

  if (isMutualMode) {
    return `Hallo,

hier ist der Beitritslink für unsere Wichtelgruppe:

${participantLink}

Diese Gruppe ist ein gegenseitiges Wichteln - das heißt, JEDER wird überrascht! Es gibt keine Wunschlisten, nur gegenseitige Überraschungen.

Klick bitte auf den Link und melde dich an. Nach der Auslosung siehst du dann, wen du beschenken darfst.

Unser Budget: ${group?.settings?.budget || 'flexibel'}

Viel Spaß beim Wichteln! 🎁`;
  }

  // Default: Flexible mode with wishlist
  return `Hallo,

hier ist der Beitritslink für unsere Wichtelgruppe:

${participantLink}

Klicke bitte auf den Link und erstelle dir eine Wunschliste mit deinen Geschenkideen. Nach Abschluss des Prozesses bekommst du erneut einen Link mit deinem Wichtelpartner und dessen Wunschliste.

Auch wenn du keine Wunschliste möchtest, folge bitte dem Link. Du kannst dann wählen, dass du überrascht werden möchtest.

Unser Budget: ${group?.settings?.budget || 'flexibel'}

Wenn du nicht teilnehmen möchtest, informiere den Organisator direkt oder folge dem Link und melde dich ab!

Viel Spaß beim Wichteln! 🎁`;
};

export const getPostDrawShareText = (participantLink) => `Hallo,

die Wichtel-Paarungen wurden ausgelost! Klick auf den Link und melde dich an, um deinen Wichtelpartner zu sehen:

${participantLink}

⚠️ Du brauchst deine PIN, um die Seite zu öffnen.
Wenn du deine PIN vergessen hast, wende dich an den Organisator!

Viel Spaß beim Einkaufen! 🎁`;

export const DEFAULT_INVITATION_TEXT = `Hallo,

hier ist der Beitritslink für unsere Wichtelgruppe:

[LINK_HIER_EINFUEGEN]

Klicke bitte auf den Link und erstelle dir eine Wunschliste. Nach Abschluss des Prozesses bekommst du erneut einen Link mit deinem Wichtelpartner und dessen Wunschliste.

Auch wenn du keine Wunschliste möchtest, folge bitte dem Link. Du kannst dann wählen, dass du überrascht werden möchtest.

Wenn du nicht teilnehmen möchtest, informiere den Organisator direkt oder folge dem Link und melde dich ab!

Viel Spaß beim Wichteln! 🎁`;
