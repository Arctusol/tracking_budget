import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { LineChart, Wallet, Users, TrendingUp, CreditCard, PieChart, Receipt } from 'lucide-react';

const BarChart = () => {
  const bars = [
    { height: "60%", color: "bg-indigo-100", delay: 0 },
    { height: "80%", color: "bg-purple-200", delay: 0.1 },
    { height: "40%", color: "bg-indigo-100", delay: 0.2 },
    { height: "70%", color: "bg-purple-200", delay: 0.3 },
    { height: "50%", color: "bg-indigo-100", delay: 0.4 },
    { height: "30%", color: "bg-purple-200", delay: 0.5 },
    { height: "90%", color: "bg-indigo-100", delay: 0.6 },
    { height: "20%", color: "bg-purple-200", delay: 0.7 }
  ];

  return (
    <div className="flex items-end gap-2 h-32">
      {bars.map((bar, index) => (
        <motion.div
          key={index}
          initial={{ height: 0 }}
          animate={{ 
            height: bar.height,
            transition: {
              duration: 5,
              delay: bar.delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut",
            }
            
          }}
          className={`w-6 rounded-t-lg ${bar.color}`}
        />
      ))}
    </div>
  );
};

const FloatingIcon = ({ icon: Icon, label, className = "", animate = {} }) => (
  <motion.div
    initial={{ opacity: 0.9, scale: 1 }}
    animate={{ 
      opacity: 1, 
      ...animate
    }}
    whileHover={{ scale: 1.1, rotate: 3 }}
    className={`bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 ${className}`}
  >
    <Icon className="w-12 h-12 text-primary" />
    {label && <span className="text-sm font-medium text-gray-600 text-center">{label}</span>}
  </motion.div>
);

export function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-gray-50/50 to-white/50">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold text-primary">
              Spend Wise
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/app/dashboard">
                    <Button variant="ghost">Mon tableau de bord</Button>
                  </Link>
                  <Link to="/app/profile">
                    <Button variant="outline">Mon profil</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=login">
                    <Button variant="ghost">Se connecter</Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button variant="outline">S'inscrire</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="container mx-auto px-4 pt-32 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-8">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="block"
              >
                Gérez votre budget
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="block bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70"
              >
                simplement et efficacement
              </motion.span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="text-xl text-gray-600 mb-12"
            >
              Suivez vos dépenses, gérez vos groupes et analysez vos finances en toute simplicité.
              Une solution complète pour une meilleure gestion financière.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="flex gap-4"
            >
              {user ? (
                <Link to="/app/dashboard">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 bg-primary hover:bg-primary/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  >
                    Accéder à mon tableau de bord
                  </Button>
                </Link>
              ) : (
                <Link to="/auth?mode=signup">
                  <Button 
                    size="lg" 
                    className="text-lg px-8 bg-primary hover:bg-primary/90 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/20"
                  >
                    Commencer gratuitement
                  </Button>
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Animated Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative h-[600px] w-full rounded-3xl bg-gradient-to-br from-primary/5 to-primary/10 p-8 overflow-hidden"
          >
            {/* Background Elements */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl" />
            
            {/* Bar Chart */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white p-6 rounded-2xl shadow-xl w-80"
            >
              <BarChart />
            </motion.div>
            
            {/* Floating Icons */}
            <FloatingIcon 
              icon={LineChart}
              label="Analyses détaillées"
              className="absolute top-35 left-10"
              animate={{
                y: [0, -15, 0],
                transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
            />

            <FloatingIcon 
              icon={Users}
              label="Groupes et partage"
              className="absolute top-20 left-1/2 -translate-x-1/2"
              animate={{
                y: [-15, 0, -15],
                transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
              }}
            />

            <FloatingIcon 
              icon={Receipt}
              label="Suivi des transactions"
              className="absolute bottom-32 left-12"
              animate={{
                y: [15, 0, 15],
                transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
              }}
            />

            <FloatingIcon 
              icon={Wallet}
              label="Gestion des dépenses"
              className="absolute top-52 right-8"
              animate={{
                y: [0, 15, 0],
                transition: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }
              }}
            />

            {/* Decorative circles */}
            <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-blue-100/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
} 