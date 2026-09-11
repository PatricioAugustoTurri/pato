import ContactForm from "./components/ContactForm";
import ContactIntro from "./components/ContactIntro";

export default function ContactPage() {
  return (
    <section className="contact-page" id="contacto">
      <ContactIntro />
      <div className="contact-form-wrap">
        <ContactForm />
      </div>
    </section>
  );
}