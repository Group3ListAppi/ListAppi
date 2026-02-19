export const mapAuthError = (e: any): string => {
  const code = e?.code;

  return code === "auth/email-already-in-use"
    ? "Sähköposti on jo käytössä."
    : code === "auth/wrong-password" || code === "auth/invalid-credential"
    ? "Väärä sähköposti tai salasana."
    : code === "auth/user-not-found"
    ? "Käyttäjää ei löydy."
    : code === "auth/weak-password"
    ? "Salasana on liian lyhyt (min 6 merkkiä)."
    : code === "auth/invalid-email"
    ? "Sähköpostiosoite ei ole kelvollinen."
    : e?.message ?? "Kirjautuminen epäonnistui.";
};