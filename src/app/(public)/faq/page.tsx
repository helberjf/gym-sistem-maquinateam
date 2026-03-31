import type { Metadata } from 'next';
import { BRAND } from '@/lib/constants/brand';

export const metadata: Metadata = {
  title: 'FAQ — Perguntas Frequentes',
};

// Conteúdo migrado do legado faq.html
const FAQ_CATEGORIES = [
  {
    title: 'Sobre a Academia',
    items: [
      {
        question: 'Quais modalidades de luta a academia oferece?',
        answer: `A Maquina Team oferece ${BRAND.modalities.join(', ')}. Todas as modalidades são ministradas pelo ${BRAND.instructor}, multi campeão e instrutor reconhecido no cenário nacional.`,
      },
      {
        question: 'A academia é adequada para iniciantes?',
        answer:
          'Absolutamente! A Maquina Team é perfeita tanto para iniciantes quanto para atletas experientes. Oferecemos acompanhamento personalizado e ambiente acolhedor para quem está começando.',
      },
      {
        question: 'Qual é a experiência dos instrutores?',
        answer: `O ${BRAND.instructor} é multi campeão e possui vasta experiência no ensino de artes marciais. É reconhecido nacionalmente e tem formado diversos atletas de sucesso.`,
      },
    ],
  },
  {
    title: 'Matrículas e Planos',
    items: [
      {
        question: 'Como faço para me matricular?',
        answer: `Entre em contato pelo WhatsApp ${BRAND.contact.phone} ou visite nossa academia na ${BRAND.address.full}.`,
      },
      {
        question: 'Quais são as formas de pagamento?',
        answer:
          'Aceitamos pagamento via Pix, cartão de crédito e débito. Os pagamentos são processados com segurança pelo Mercado Pago.',
      },
      {
        question: 'Posso cancelar meu plano?',
        answer:
          'Sim. Planos mensais podem ser cancelados a qualquer momento. Para planos semestrais e anuais, consulte as condições específicas na academia.',
      },
    ],
  },
  {
    title: 'Treinos e Horários',
    items: [
      {
        question: 'Quais são os horários de funcionamento?',
        answer: `${BRAND.hours.label}.`,
      },
      {
        question: 'Preciso levar algum equipamento?',
        answer:
          'Para as primeiras aulas não é necessário equipamento. Após a matrícula, orientamos sobre os materiais necessários para cada modalidade.',
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
          Perguntas Frequentes
        </h1>
        <p className="text-brand-gray-light text-lg">
          Tire suas dúvidas sobre a {BRAND.name}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-12">
        {FAQ_CATEGORIES.map((category) => (
          <section key={category.title}>
            <h2 className="text-xl font-bold text-brand-red mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-brand-red rounded-full inline-block" />
              {category.title}
            </h2>

            <div className="space-y-4">
              {category.items.map((item) => (
                <details
                  key={item.question}
                  className="group bg-brand-gray-dark rounded-xl border border-brand-gray-mid overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-white font-medium select-none list-none">
                    {item.question}
                    <span className="text-brand-red ml-4 flex-shrink-0 transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>
                  <div className="px-6 pb-4 text-brand-gray-light text-sm leading-relaxed">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
