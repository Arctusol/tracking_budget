import { motion } from 'framer-motion';

const screenshots = [
  {
    title: "Tableau de bord",
    description: "Vue d'ensemble de vos finances et dépenses récentes",
    imagePath: "/images/screenshots/dashboard-placeholder.png"
  },
  {
    title: "Gestion de groupe",
    description: "Gérez facilement les dépenses partagées",
    imagePath: "/images/screenshots/group-dashboard-placeholder.png"
  },
  {
    title: "Import de reçus",
    description: "Importez et analysez vos reçus automatiquement",
    imagePath: "/images/screenshots/import-placeholder.png"
  }
];

function ScreenshotCard({ title, description, imagePath }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
    >
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        <motion.img
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          src={imagePath}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
}

export function Screenshots() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-4">Découvrez l'interface</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une expérience utilisateur intuitive et moderne pour gérer vos finances
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <ScreenshotCard {...screenshot} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 