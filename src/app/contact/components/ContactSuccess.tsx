import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type ContactSuccessProps = {
  onReset: () => void;
};

export default function ContactSuccess({ onReset }: ContactSuccessProps) {
  return (
    <div className="contact-success" role="status">
      <Check aria-hidden="true" />
      <h2>Tu mensaje salió.</h2>
      {/* El mecanismo, no una promesa: el route manda el mail con `replyTo` en
          la dirección de quien escribe, así que la respuesta llega ahí. Sin
          plazos: no hay nada que los garantice. */}
      <p>Te respondo al mismo email desde el que escribiste.</p>
      <Button type="button" variant="outline" onClick={onReset}>
        Escribir otro mensaje
      </Button>
    </div>
  );
}
