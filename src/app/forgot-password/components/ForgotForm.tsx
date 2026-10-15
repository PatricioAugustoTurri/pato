"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { looksLikeEmail } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();

    if (!looksLikeEmail(address)) {
      setError("Check the format of the email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.post("/api/password/forgot", { email: address });
      setSentTo(address);
    } catch (err) {
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
      setError(message || "We could not send the link. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* El mismo mensaje haya o no una cuenta con ese email: es lo que contesta
     el servidor, y la pantalla no puede saber más que él. Por eso dice "si
     hay una cuenta" y no "te mandamos". */
  if (sentTo) {
    return (
      <div className="auth-counter-inner auth-done" role="status">
        <h2>
          Check your <i>inbox.</i>
        </h2>
        <p>
          If there is an account for <b>{sentTo}</b>, the link is on its way. It works
          once, for one hour. Nothing there after a few minutes? Look in spam, or ask
          again.
        </p>
        <p className="auth-switch">
          <button type="button" className="auth-again" onClick={() => setSentTo(null)}>
            Use another email
          </button>
          {" · "}
          <Link href="/login">Back to sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-counter-inner">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "forgot-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error && (
          <span className="auth-error" id="forgot-error" role="alert">
            {error}
          </span>
        )}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send the link"}
        </Button>
      </form>
      <p className="auth-switch">
        Remembered it? <Link href="/login">Sign in</Link>
      </p>
    </div>
  );
}
