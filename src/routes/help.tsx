import { createFileRoute } from "@tanstack/react-router";
import { Book, MessageCircle, Mail, Github, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — Cloud Mint" },
      { name: "description", content: "Docs, FAQs, and support channels for Cloud Mint." },
      { property: "og:title", content: "Help — Cloud Mint" },
      { property: "og:description", content: "Get help with your Cloud Mint workspace." },
    ],
  }),
  component: Help,
});

const cards = [
  { icon: Book, title: "Documentation", desc: "Guides, API reference, and tutorials." },
  { icon: MessageCircle, title: "Community", desc: "Join 4,200+ developers on Discord." },
  { icon: Mail, title: "Contact support", desc: "Email us — replies within 4h." },
  { icon: Github, title: "Changelog", desc: "See what shipped in every release." },
];

const faqs = [
  { q: "How many sessions can I run?", a: "The Scale plan lifts session limits — Free includes up to 3 concurrent sessions." },
  { q: "Is Baileys officially supported?", a: "Cloud Mint is built on top of Baileys and stays in sync with upstream releases." },
  { q: "Can I self-host?", a: "Yes — a Docker image and Helm chart are available for enterprise workspaces." },
  { q: "How do I rotate my API keys?", a: "Head to API Manager › Rotate. Old keys keep working for 24h to allow a graceful cutover." },
];

function Help() {
  return (
    <div className="space-y-6">
      <PageHeader title="Help & Resources" description="Everything you need to get productive with Cloud Mint." />

      <Card className="glass rounded-2xl p-6 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Support</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">How can we help?</h2>
        <div className="mx-auto mt-4 max-w-md">
          <Input placeholder="Search articles, guides, API…" className="h-11 rounded-xl" />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title} className="glass group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/30">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <c.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold">{c.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition group-hover:opacity-100">
              Learn more <ExternalLink className="h-3 w-3" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass rounded-2xl p-5">
        <h3 className="mb-2 font-semibold">Frequently asked</h3>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="border-border">
              <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}
