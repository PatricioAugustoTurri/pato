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
          ? "El formulario todavía no está conectado."
          : "No salió el mensaje.",
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
          <label htmlFor="name">Nombre</label>
          <Input
            id="name"
            placeholder="Cómo te llamás"
            aria-invalid={Boolean(errors.name)}
            {...register("name", { required: "Decime cómo te llamás" })}
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
              required: "Necesito tu email para responderte",
              pattern: { value: /^\S+@\S+\.\S+$/, message: "Revisá el formato del email" },
            })}
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>
      </div>
      <div className="contact-field">
        <label htmlFor="subject">Asunto</label>
        <Input
          id="subject"
          placeholder="¿De qué se trata?"
          aria-invalid={Boolean(errors.subject)}
          {...register("subject", { required: "Poné un asunto" })}
        />
        {errors.subject && <span className="field-error">{errors.subject.message}</span>}
      </div>
      <div className="contact-field">
        <label htmlFor="message">Mensaje</label>
        <Textarea
          id="message"
          placeholder="Contame"
          aria-invalid={Boolean(errors.message)}
          {...register("message", {
            required: "Escribí un mensaje para poder leerte",
            minLength: { value: 10, message: "Contame un poco más: al menos 10 caracteres" },
          })}
        />
        {errors.message && <span className="field-error">{errors.message.message}</span>}
      </div>
      {submitError && (
        <p className="contact-form-error" role="alert">
          <strong>{submitError}</strong>
          {showFallback && (
            <span>
              Escribime directo a{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> y te respondo por ahí.
            </span>
          )}
        </p>
      )}
      <Button className="contact-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando…" : "Enviar mensaje"}
        <ArrowUpRight aria-hidden="true" />
      </Button>
    </form>
  );
}