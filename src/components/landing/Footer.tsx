import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const footerLinks = {
  product: [
    { name: "Fonctionnalités", href: "/features" },
    { name: "Tarifs", href: "/pricing" },
  ],
  resources: [
    { name: "Centre d'aide", href: "/help" },
    { name: "Contact", href: "/contact" }
  ],
  legal: [
    { name: "Confidentialité", href: "/privacy" },
    { name: "Conditions d'utilisation", href: "/terms" },
    { name: "RGPD", href: "/gdpr" }
  ]
};

function FooterSection({ title, links }) {
  return (
    <div>
      <h4 className="text-white font-semibold mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <motion.li
            key={link.name}
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link 
              to={link.href} 
              className="hover:text-white transition-colors duration-200 block"
            >
              {link.name}
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="w-8 h-8 text-primary" />
              <h3 className="text-white font-bold">SpendWise</h3>
            </Link>
            <p className="text-sm">
              La solution moderne pour gérer vos finances personnelles et partagées.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <FooterSection title="Produit" links={footerLinks.product} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FooterSection title="Ressources" links={footerLinks.resources} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <FooterSection title="Légal" links={footerLinks.legal} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-gray-800 mt-12 pt-8 text-center text-sm"
        >
          <p>&copy; {currentYear} TrackingBudget. Tous droits réservés.</p>
        </motion.div>
      </div>
    </footer>
  );
} 