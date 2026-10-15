"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import PasswordField from "@/components/PasswordField";

const MIN_LENGTH = 8;

export default function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  /* Un enlace vencido o gastado no se arregla reintentando: el formulario se
     va y queda la salida, que es pedir otro. */
  const [isDeadLink, setIsDeadLink] = useState(!token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password.length < MIN_LENGTH) {
      setError(`Your password needs at least ${MIN_LENGTH} characters.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.post("/api/password/reset", { token, password });
      setIsDone(true);
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;

      if (status === 410) {
        setIsDeadLink(true);
      } else {
        setError(message || "We could not change the password. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="auth-counter-inner auth-done" role="status">
        <h2>
          Password <i>changed.</i>
        </h2>
        <p>Sign in with the new one. The link in the email no longer works.</p>
        <Link className="auth-submit auth-submit-link" href="/login">
          Sign in
        </Link>
      </div>
    );
  }

  if (isDeadLink) {
    return (
      <div className="auth-counter-inner auth-done" role="alert">
        <h2>
          This link has <i>expired.</i>
        </h2>
        <p>
          {token
            ? "Links work once and for one hour, and this one is spent. Ask for a new one — it takes a minute."
            : "The address is missing part of the link. Open it again from the email, or ask for a new one."}
        </p>
        <Link className="auth-submit auth-submit-link" href="/forgot-password">
          Ask for a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-counter-inner">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="password">New password</label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            minLength={MIN_LENGTH}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "reset-password-hint reset-error" : "reset-password-hint"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoFocus
          />
          <span className="auth-hint" id="reset-password-hint">
            At least {MIN_LENGTH} characters
          </span>
        </div>
        {error && (
          <span className="auth-error" id="reset-error" role="alert">
            {error}
          </span>
        )}
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save the new password"}
        </Button>
      </form>
      <p className="auth-switch">
        Changed your mind? <Link href="/login">Back to sign in</Link>
      </p>
    </div>
  );
}
