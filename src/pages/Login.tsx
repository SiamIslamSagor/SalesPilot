import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = t("validation.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(email))
      errors.email = t("validation.emailInvalid");
    if (!password) errors.password = t("validation.passwordRequired");
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      } else {
        toast({
          title: t("login.invalidCredentials"),
          description: t("login.checkEmail"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("login.error"),
        description: t("login.checkEmail"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-48 mx-auto mb-4 p-4 bg-primary rounded-lg">
            <img
              src="https://www.brandivaate.fi/wp-content/uploads/2024/10/bv-logo-white.svg"
              alt="Brandivaate Logo"
              className="w-full h-auto"
            />
          </div>
          <h1 className="text-2xl font-bold">{t("app.name")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("login.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-card border border-border rounded-lg p-6 space-y-4"
        >
          <div>
            <Label className="text-xs">{t("login.email")}</Label>
            <div className="relative mt-1">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="email"
                placeholder="Your email"
                className={`pl-9 ${fieldErrors.email ? "border-destructive" : ""}`}
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (fieldErrors.email)
                    setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <Label className="text-xs">{t("login.password")}</Label>
            <div className="relative mt-1">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="password"
                placeholder="Password"
                className={`pl-9 ${fieldErrors.password ? "border-destructive" : ""}`}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors(prev => ({ ...prev, password: undefined }));
                }}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {t("login.submit")}
          </Button>
          <Link to="/forgot-password" className="block text-center">
            <span className="text-xs text-primary hover:underline">
              {t("login.forgot")}
            </span>
          </Link>
        </form>
      </div>
    </div>
  );
}
