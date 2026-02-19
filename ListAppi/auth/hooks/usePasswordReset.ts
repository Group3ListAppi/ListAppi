import { useEffect, useState } from "react";
import type { Auth } from "firebase/auth";
import { resetPassword } from "../services/authService";

export const usePasswordReset = (auth: Auth) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const openDialog = () => {
    setMessage(null);
    setOpen(true);
  };

  const closeDialog = () => {
    setLoading(false);
    setMessage(null);
    setOpen(false);
  };

  const send = async (emailTrimmed: string, emailValid: boolean) => {
    setMessage(null);

    if (!emailTrimmed) {
      setMessage("Syötä sähköposti, niin lähetän palautuslinkin.");
      return;
    }
    if (!emailValid) {
      setMessage("Syötä kelvollinen sähköpostiosoite.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(auth, emailTrimmed);
      // Hyvä käytäntö: sama viesti aina (ei user enumeration)
      setMessage("Jos sähköposti on rekisteröity, saat pian palautuslinkin.");
      setCooldown(60);
    } catch (e: any) {
      // Voit halutessasi näyttää myös geneerisen viestin tässä
      setMessage(e?.message ?? "Palautuslinkin lähetys epäonnistui.");
    } finally {
      setLoading(false);
    }
  };

  return { open, loading, message, cooldown, openDialog, closeDialog, send, setMessage };
};