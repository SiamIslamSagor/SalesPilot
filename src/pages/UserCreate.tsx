import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";

export default function UserCreate() {
  const { addUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin" as "admin" | "superadmin",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string } = {};
    if (!form.name.trim()) errors.name = t("validation.nameRequired");
    if (!form.email.trim()) errors.email = t("validation.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errors.email = t("validation.emailInvalid");
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setIsLoading(true);

    const userData: {
      name: string;
      email: string;
      role: "admin" | "superadmin";
      password?: string;
    } = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    if (form.password) {
      userData.password = form.password;
    }

    try {
      const result = await apiService.createUser(userData);

      if (result.success) {
        toast({
          title: t("users.userCreated"),
          description: `${result.data?.name} has been created successfully`,
        });
        navigate("/users");
      } else {
        // Map backend field-level errors to inline fieldErrors
        if (result.errors?.length) {
          const backendFieldErrors: { name?: string; email?: string } = {};
          for (const err of result.errors) {
            const field = err.field as string | undefined;
            const msg = err.message || "Invalid value";
            if (field === "email" || field === "name") {
              backendFieldErrors[field] = msg;
            }
          }
          if (Object.keys(backendFieldErrors).length > 0) {
            setFieldErrors(backendFieldErrors);
          } else {
            // Non-field-specific validation errors
            toast({
              title: t("common.error"),
              description:
                result.errors[0]?.message || "Please check your input",
              variant: "destructive",
            });
          }
        } else if (
          result.message?.toLowerCase().includes("email already exists")
        ) {
          setFieldErrors({ email: result.message });
        } else {
          toast({
            title: t("common.error"),
            description: result.message || "Failed to create user",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/users">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("users.createUser")}</h1>
      </div>

      <div className="max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-lg border border-border p-6 space-y-4"
        >
          <div>
            <Label>{t("common.name")}</Label>
            <Input
              value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value });
                if (fieldErrors.name)
                  setFieldErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="John Doe"
              className={`mt-1 ${fieldErrors.name ? "border-destructive" : ""}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.name && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div>
            <Label>{t("common.email")}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => {
                setForm({ ...form, email: e.target.value });
                if (fieldErrors.email)
                  setFieldErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="john@company.fi"
              className={`mt-1 ${fieldErrors.email ? "border-destructive" : ""}`}
              required
              disabled={isLoading}
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive mt-1">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div>
            <Label>{t("common.password")}</Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          <div>
            <Label>{t("common.role")}</Label>
            <Select
              value={form.role}
              onValueChange={(v: "admin" | "superadmin") =>
                setForm({ ...form, role: v })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t("users.admin")}</SelectItem>
                <SelectItem value="superadmin">
                  {t("users.superAdmin")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/users")}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : t("users.createUser")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
