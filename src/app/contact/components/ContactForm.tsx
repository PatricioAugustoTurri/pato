"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ContactSuccess from "./ContactSuccess";

const CONTACT_EMAIL = "hola@patoturri.com";

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  /* Cuando el envío falla, el email directo deja de ser un dato de la columna
     de al lado y pasa a ser la salida: se muestra dentro del propio error. */
  const [showFallback, setShowFallback] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({ mode: "onBlur" });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);
    setShowFallback(false);

    try {
      await axios.post("/api/contact", values);
      setSubmitted(true);
      reset();
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      /* 503 es el formulario sin configurar: no es un problema de red y volver
         a intentar no lo arregla, así que no se pide reintentar. */
      setSubmitError(
        status === 503
          ? "The form is not connected yet."
          : "The message did not go through.",
      );
      setShowFallback(true);
    }
  };

  if (submitted) {
    return <ContactSuccess onReset={() => setSubmitted(false)} />;
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="contact-form-row">
        <div className="contact-field">
          <label htmlFor="name">Name</label>
          <Input
            id="name"
            placeholder="What you go by"
            aria-invalid={Boolean(errors.name)}
            {...register("name", { required: "Tell me what you go by" })}
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
        </div>
        <div className="contact-field">
          <label htmlFor="email">Email</label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email", {
              required: "I need your email to write back",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Check the format of the email" },
            })}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>
      </div>
      <div className="contact-field">
        <label htmlFor="subject">Subject</label>
        <Input
          id="subject"
          placeholder="What is it about?"
          aria-invalid={Boolean(errors.subject)}
          {...register("subject", { required: "Add a subject" })}
        />
        {errors.subject && <span className="field-error">{errors.subject.message}</span>}
      </div>
      <div className="contact-field">
        <label htmlFor="message">Message</label>
        <Textarea
          id="message"
          placeholder="Tell me"
          aria-invalid={Boolean(errors.message)}
          {...register("message", {
            required: "Write a message so I can read you",
            minLength: { value: 10, message: "Tell me a little more: at least 10 characters" },
          })}
        />
        {errors.message && <span className="field-error">{errors.message.message}</span>}
      </div>
      {submitError && (
        <p className="contact-form-error" role="alert">
          <strong>{submitError}</strong>
          {showFallback && (
            <span>
              Write to me directly at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and I will answer there.
            </span>
          )}
        </p>
      )}
      <Button className="contact-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
        <ArrowUpRight aria-hidden="true" />
      </Button>
    </form>
  );
}