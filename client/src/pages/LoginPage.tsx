import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: t("auth.login.toast.success.title"),
        description: t("auth.login.toast.success.desc"),
      });
      navigate("/");
    } catch (error) {
      toast({
        title: t("auth.login.toast.error.title"),
        description:
          error instanceof Error ? error.message : t("auth.login.toast.error.desc"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("auth.login.backHome")}
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {t("auth.login.title")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("auth.login.subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.login.email.label")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.login.email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.login.password.label")}</Label>
                <a href="#" className="text-sm text-accent hover:underline">
                  {t("auth.login.forgot")}
                </a>
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.login.password.placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? t("auth.login.password.hide")
                      : t("auth.login.password.show")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? t("auth.login.button.loading") : t("auth.login.button.submit")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link to="/register" className="text-accent hover:underline font-medium">
              {t("auth.login.createOne")}
            </Link>
          </p>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-secondary rounded-lg">
            <p className="text-sm font-medium mb-2">{t("auth.login.demo.title")}</p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {t("auth.login.demo.body")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:flex-1 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <blockquote className="font-display text-2xl italic text-foreground/80">
            {t("auth.login.quote.text")}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.login.quote.author")}
          </p>
        </div>
      </div>
    </div>
  );
}
