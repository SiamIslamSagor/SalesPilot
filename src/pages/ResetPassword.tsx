import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import api from "@/services/api";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset.",
      );
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(
        "Invalid or missing reset token. Please request a new password reset.",
      );
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await api.resetPasswordWithToken(
        token,
        password,
        confirmPassword,
      );
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold">Password Reset Successful</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>
            <Link to="/">
              <Button className="w-full mt-4">
                <ArrowLeft size={16} className="mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-card border border-border rounded-lg p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold">Invalid Reset Link</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired. Please request
              a new password reset.
            </p>
            <Link to="/forgot-password">
              <Button variant="outline" className="w-full mt-4">
                Request New Reset Link
              </Button>
            </Link>
            <Link to="/" className="block text-center mt-2">
              <span className="text-xs text-primary hover:underline">
                Back to Login
              </span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your new password below
          </p>
        </div>

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
            <Label className="text-xs">New Password</Label>
            <div className="relative mt-1">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="password"
                required
                placeholder="Enter new password"
                className="pl-9"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 6 characters with uppercase, lowercase, and
              number
            </p>
          </div>

          <div>
            <Label className="text-xs">Confirm Password</Label>
            <div className="relative mt-1">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="password"
                required
                placeholder="Confirm new password"
                className="pl-9"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          <div className="text-center space-y-2">
            <Link to="/forgot-password" className="block">
              <span className="text-xs text-primary hover:underline">
                Request new reset link
              </span>
            </Link>
            <Link to="/" className="block">
              <span className="text-xs text-muted-foreground hover:underline">
                Back to Login
              </span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
