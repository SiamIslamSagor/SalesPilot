import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import api from "@/services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError(t("validation.emailRequired"));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t("validation.emailInvalid"));
      return;
    }
    setEmailError("");
    setError("");
    setLoading(true);

    try {
      const result = await api.forgotPassword(email);
      if (result.success) {
        setSent(true);
      } else {
        setError(result.message || "Failed to send reset email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
            <Mail size={24} />
          </div>
          <h1 className="text-2xl font-bold">{t("forgot.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("forgot.subtitle")}
          </p>
        </div>

        {sent ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <Mail size={28} />
            </div>
            <p className="text-sm text-foreground font-medium">
              {t("forgot.sent")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("forgot.checkInbox")}{" "}
              <span className="font-medium">{email}</span>
            </p>
            <Link to="/">
              <Button variant="outline" className="w-full mt-2">
                <ArrowLeft size={16} className="mr-2" />{" "}
                {t("forgot.backToLogin")}
              </Button>
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-lg p-6 space-y-4"
          >
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}
            <div>
              <Label className="text-xs">{t("forgot.emailLabel")}</Label>
              <div className="relative mt-1">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="email"
                  required
                  placeholder="your@email.fi"
                  className={`pl-9 ${emailError ? "border-destructive" : ""}`}
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  disabled={loading}
                />
              </div>
              {emailError && (
                <p className="text-xs text-destructive mt-1">{emailError}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                t("forgot.submit")
              )}
            </Button>
            <Link to="/" className="block text-center">
              <span className="text-xs text-primary hover:underline">
                {t("forgot.backToLogin")}
              </span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
