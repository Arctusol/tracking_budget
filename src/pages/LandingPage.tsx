import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../lib/auth';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CreditCardIcon, 
  ArrowTrendingUpIcon, 
  ShieldCheckIcon, 
  DocumentChartBarIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { Screenshots } from '../components/landing/Screenshots';
import { Stats } from '../components/landing/Stats';
import { FAQ } from '../components/landing/FAQ';
import { Footer } from '../components/landing/Footer';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Hero />
      <Features />
      <Screenshots />
      <Stats />
      <FAQ />
      <Footer />
    </div>
  );
}