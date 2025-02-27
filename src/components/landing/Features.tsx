import { motion } from 'framer-motion';
import { LineChart, Wallet, Users, Receipt } from 'lucide-react';

function FeatureCard({ icon: Icon, title, description, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <motion.div
        whileHover={{ y: -5, scale: 1.02 }}
        className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <div className="relative">
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: delay * 0.5,
            }}
            className="mb-6 inline-block"
          >
            <div className="p-4 bg-primary/5 rounded-xl">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
          
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </motion.div>
  );
}

export function Features() {
  const features = [
    {
      icon: LineChart,
      title: "Analyses détaillées",
      description: "Visualisez vos habitudes de dépenses avec des graphiques clairs et des rapports détaillés pour une meilleure compréhension de vos finances."
    },
    {
      icon: Wallet,
      title: "Gestion des dépenses",
      description: "Gardez un œil sur toutes vos dépenses et catégorisez-les facilement pour un meilleur contrôle de votre budget."
    },
    {
      icon: Users,
      title: "Groupes et partage",
      description: "Partagez et gérez les dépenses en groupe de manière transparente. Idéal pour les colocations, voyages et événements."
    },
    {
      icon: Receipt,
      title: "Suivi des transactions",
      description: "Enregistrez et suivez toutes vos transactions en temps réel avec des notifications et des rappels personnalisés."
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50/50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Fonctionnalités principales</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez tous les outils dont vous avez besoin pour une gestion financière efficace
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.title}
              {...feature}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 