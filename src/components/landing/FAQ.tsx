import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { QuestionMarkCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface FaqItemProps {
  question: string;
  answer: string;
  index: number;
}

function FaqItem({ question, answer, index }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg"
      >
        <QuestionMarkCircleIcon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div className="flex-grow">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-lg font-semibold pr-4">{question}</h3>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronDownIcon className="w-5 h-5 text-gray-500" />
            </motion.div>
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-gray-600 mt-4">{answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </motion.div>
  );
}

export function FAQ() {
  const faqs = [
    {
      question: "Comment fonctionne l'import des relevés bancaires ?",
      answer: "Notre système supporte l'import de fichiers CSV et PDF des principales banques. Il suffit de télécharger votre relevé et notre système analysera automatiquement les transactions."
    },
    {
      question: "Comment créer un groupe de dépenses ?",
      answer: "Créez un groupe en quelques clics, invitez vos amis ou colocataires par email, et commencez à partager vos dépenses. Chaque membre peut ajouter des dépenses et voir les soldes en temps réel."
    },
    {
      question: "Comment fonctionne la reconnaissance des tickets de caisse ?",
      answer: "Prenez simplement en photo votre ticket de caisse. Notre technologie OCR analysera automatiquement les articles et les montants pour les ajouter à vos dépenses."
    },
    {
      question: "Les données sont-elles sécurisées ?",
      answer: "Absolument ! Nous utilisons un chiffrement de bout en bout et respectons les normes les plus strictes en matière de sécurité des données financières."
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Questions fréquentes</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tout ce que vous devez savoir pour bien démarrer
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              {...faq}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 