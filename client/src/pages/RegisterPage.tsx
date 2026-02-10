import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function RegisterPage() {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast({
        title: t("auth.register.toast.termsRequired.title"),
        description: t("auth.register.toast.termsRequired.desc"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      toast({
        title: t("auth.register.toast.success.title"),
        description: t("auth.register.toast.success.desc"),
      });
      navigate("/");
    } catch (error) {
      toast({
        title: t("auth.register.toast.error.title"),
        description:
          error instanceof Error
            ? error.message
            : t("auth.register.toast.error.desc"),
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
            {t("auth.register.backHome")}
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
            {t("auth.register.title")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("auth.register.subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.register.fullName.label")}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("auth.register.fullName.placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.register.email.label")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.register.email.placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.register.password.label")}</Label>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.register.password.placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? t("auth.register.password.hide")
                      : t("auth.register.password.show")
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t("auth.register.password.hint")}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              />

              <Label
                htmlFor="terms"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {t("auth.register.terms.prefix")}{" "}
                <a href="#" className="text-accent hover:underline">
                  {t("auth.register.terms.tos")}
                </a>{" "}
                {t("auth.register.terms.and")}{" "}
                <a href="#" className="text-accent hover:underline">
                  {t("auth.register.terms.privacy")}
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? t("auth.register.button.loading")
                : t("auth.register.button.submit")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("auth.register.haveAccount")}{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">
              {t("auth.register.signIn")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:flex-1 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12">
          <blockquote className="font-display text-2xl italic text-foreground/80">
            {t("auth.register.quote.text")}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.register.quote.author")}
          </p>
        </div>
      </div>
    </div>
  );
}
