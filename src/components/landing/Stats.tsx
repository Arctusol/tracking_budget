import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

interface StatProps {
  number: string;
  label: string;
  delay: number;
}

function StatCard({ number, label, delay }: StatProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const finalNumber = parseInt(number.replace(/[^0-9]/g, ''));

  useEffect(() => {
    if (isInView) {
      const duration = 1800; // 2 secondes pour l'animation
      const steps = 60;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        setCount(Math.floor(finalNumber * progress));

        if (currentStep === steps) {
          clearInterval(timer);
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [isInView, finalNumber]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="text-center group"
    >
      <motion.div 
        className="text-4xl font-bold text-primary mb-2 relative"
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {isInView ? `${count}${number.includes('+') ? '+' : ''}` : '0'}
        <div className="absolute -inset-2 bg-primary/5 scale-0 group-hover:scale-100 rounded-lg transition-transform duration-300" />
      </motion.div>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  );
}

export function Stats() {
  const stats = [
    { number: "38", label: "Utilisateurs actifs" },
    { number: "2890", label: "Transactions suivies" },
    { number: "57", label: "Groupes créés" },
    { number: "38", label: "Utilisateurs satisfaits" }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              {...stat}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 