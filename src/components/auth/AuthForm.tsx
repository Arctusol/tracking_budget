import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation du mot de passe
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
      });
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        toast({
          title: "Compte créé",
          description: "Veuillez vérifier votre email pour confirmer votre compte.",
        });
        navigate("/");
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (error) {
      // Gestion personnalisée des erreurs
      let errorMessage = "Une erreur inattendue s'est produite";
      
      if (error.message.includes("Email not confirmed")) {
        errorMessage = "Veuillez confirmer votre email avant de vous connecter";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Email ou mot de passe incorrect";
      } else if (error.message.includes("Email already registered")) {
        errorMessage = "Cet email est déjà utilisé";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Veuillez entrer une adresse email valide";
      }

      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-6 space-y-6 bg-white">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome to SpendWise</h1>
        <p className="text-gray-500">
          {isSignUp
            ? "Create an account to continue"
            : "Sign in to your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
        </Button>
      </form>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-primary hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Don't have an account? Sign up"}
        </button>
      </div>
    </Card>
  );
}
