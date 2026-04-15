import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Settings as SettingsIcon,
  Mail,
  Calculator,
  Eye,
  Pencil,
  Save,
  RotateCcw,
  Code,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Percent,
  AlertTriangle,
  Check,
  Globe,
} from "lucide-react";
import { parseEuroNumber } from "@/lib/utils";

// --- Highlighted HTML Editor ---

function HighlightedEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const highlighted = useMemo(() => {
    // Escape HTML then wrap {{...}} in <mark>
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return (
      escaped.replace(
        /\{\{(\w+)\}\}/g,
        '<mark class="bg-violet-200 text-violet-900 rounded px-0.5">{{$1}}</mark>',
      ) + "\n"
    );
  }, [value]);

  const syncScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative w-full h-80 rounded-md border border-input bg-background">
      {/* Highlight backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 overflow-auto px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words pointer-events-none"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      {/* Transparent textarea on top */}
      <textarea
        ref={textareaRef}
        className="absolute inset-0 w-full h-full px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words bg-transparent text-transparent caret-foreground resize-none outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
      />
    </div>
  );
}

// --- Types ---

interface EmailTemplate {
  _id: string;
  templateKey: string;
  subject: string;
  htmlBody: string;
  enabled: boolean;
  description?: string;
  recipientEmail?: string;
  updatedAt: string;
}

// --- Component ---

export default function Settings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";

  // ---- Email Settings State ----
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editHtmlBody, setEditHtmlBody] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);
  const [editRecipientEmail, setEditRecipientEmail] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [pendingDisableTemplate, setPendingDisableTemplate] =
    useState<EmailTemplate | null>(null);
  const [disableSource, setDisableSource] = useState<"table" | "editor">(
    "table",
  );

  // ---- Custom Margin State ----
  const [customMarginPercentage, setCustomMarginPercentage] = useState(0);
  const [marginPercentageDisplay, setMarginPercentageDisplay] = useState("0");
  const [marginMode, setMarginMode] = useState<"fallback" | "override">(
    "fallback",
  );
  const [customMarginLoading, setCustomMarginLoading] = useState(false);
  const [customMarginSaving, setCustomMarginSaving] = useState(false);

  // Track saved values for dirty-state detection
  const [savedMarginPercentage, setSavedMarginPercentage] = useState(0);
  const [savedMarginMode, setSavedMarginMode] = useState<
    "fallback" | "override"
  >("fallback");

  // Override confirmation dialog
  const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false);

  // ---- Global Admin Email State ----
  const [globalAdminEmail, setGlobalAdminEmail] = useState("");
  const [ccGlobalAdmin, setCcGlobalAdmin] = useState(false);
  const [savedGlobalAdminEmail, setSavedGlobalAdminEmail] = useState("");
  const [savedCcGlobalAdmin, setSavedCcGlobalAdmin] = useState(false);
  const [globalAdminSaving, setGlobalAdminSaving] = useState(false);

  // ====== Handlers ======

  const fetchEmailTemplates = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res = await apiService.getEmailTemplates();
      if (res.success && res.data) {
        setEmailTemplates(res.data);
      } else {
        toast({
          title: t("common.error"),
          description: res.message || t("settings.emailLoadError"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.emailLoadError"),
        variant: "destructive",
      });
    } finally {
      setEmailLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchEmailTemplates();
  }, [fetchEmailTemplates]);

  const fetchCustomMargin = useCallback(async () => {
    setCustomMarginLoading(true);
    try {
      const res = await apiService.getAppSettings();
      if (res.success && res.data) {
        const pct = res.data.customMarginPercentage;
        const mode = res.data.marginMode || "fallback";
        setCustomMarginPercentage(pct);
        setMarginPercentageDisplay(String(pct));
        setMarginMode(mode);
        setSavedMarginPercentage(pct);
        setSavedMarginMode(mode);

        const email = res.data.globalAdminEmail || "";
        const cc = res.data.ccGlobalAdmin || false;
        setGlobalAdminEmail(email);
        setCcGlobalAdmin(cc);
        setSavedGlobalAdminEmail(email);
        setSavedCcGlobalAdmin(cc);
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.customMarginLoadError"),
        variant: "destructive",
      });
    } finally {
      setCustomMarginLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchCustomMargin();
  }, [fetchCustomMargin]);

  const handleSaveCustomMargin = async () => {
    setCustomMarginSaving(true);
    try {
      const res = await apiService.updateAppSettings({
        customMarginPercentage,
        marginMode,
      });
      if (res.success) {
        setSavedMarginPercentage(customMarginPercentage);
        setSavedMarginMode(marginMode);
        toast({
          title: t("common.success"),
          description: t("settings.customMarginSaved"),
        });
      } else {
        toast({
          title: t("common.error"),
          description: res.message || t("settings.customMarginSaveError"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.customMarginSaveError"),
        variant: "destructive",
      });
    } finally {
      setCustomMarginSaving(false);
    }
  };

  const handleSaveGlobalAdmin = async () => {
    setGlobalAdminSaving(true);
    try {
      const res = await apiService.updateAppSettings({
        globalAdminEmail,
        ccGlobalAdmin,
      });
      if (res.success) {
        setSavedGlobalAdminEmail(globalAdminEmail);
        setSavedCcGlobalAdmin(ccGlobalAdmin);
        toast({
          title: t("common.success"),
          description: t("settings.globalAdminSaved"),
        });
      } else {
        toast({
          title: t("common.error"),
          description: res.message || t("settings.globalAdminSaveError"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.globalAdminSaveError"),
        variant: "destructive",
      });
    } finally {
      setGlobalAdminSaving(false);
    }
  };

  const openTemplateEditor = (tpl: EmailTemplate) => {
    setEditingTemplate(tpl);
    setEditSubject(tpl.subject);
    setEditHtmlBody(tpl.htmlBody);
    setEditEnabled(tpl.enabled);
    setEditRecipientEmail(tpl.recipientEmail || user?.email || "");
    setShowPreview(false);
    setTemplateEditorOpen(true);
  };

  const isAdminTemplate = (key: string) =>
    ["offer_accepted_admin", "offer_rejected_admin"].includes(key);

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    // Require recipientEmail for admin notification templates when enabled
    if (
      isAdminTemplate(editingTemplate.templateKey) &&
      editEnabled &&
      !editRecipientEmail.trim()
    ) {
      toast({
        title: t("common.error"),
        description: t("settings.recipientEmailRequired"),
        variant: "destructive",
      });
      return;
    }

    setSavingTemplate(true);
    try {
      const res = await apiService.updateEmailTemplate(
        editingTemplate.templateKey,
        {
          subject: editSubject,
          htmlBody: editHtmlBody,
          enabled: editEnabled,
          recipientEmail: editRecipientEmail,
        },
      );
      if (res.success) {
        toast({
          title: t("common.success"),
          description: t("settings.templateSaved"),
        });
        setTemplateEditorOpen(false);
        fetchEmailTemplates();
      } else {
        toast({
          title: t("common.error"),
          description: res.message || t("settings.templateSaveError"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.templateSaveError"),
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = async (key: string) => {
    try {
      const res = await apiService.resetEmailTemplate(key);
      if (res.success) {
        toast({
          title: t("common.success"),
          description: t("settings.templateReset"),
        });
        fetchEmailTemplates();
        setTemplateEditorOpen(false);
      } else {
        toast({
          title: t("common.error"),
          description: res.message || t("settings.templateResetError"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.templateResetError"),
        variant: "destructive",
      });
    }
  };

  const requestToggleTemplate = (
    tpl: EmailTemplate,
    source: "table" | "editor",
  ) => {
    if (tpl.enabled) {
      // Disabling — ask for confirmation
      setPendingDisableTemplate(tpl);
      setDisableSource(source);
      setDisableConfirmOpen(true);
    } else {
      // Re-enabling — block if admin template has no recipientEmail
      const recipientToCheck =
        source === "editor" ? editRecipientEmail : tpl.recipientEmail;
      if (isAdminTemplate(tpl.templateKey) && !recipientToCheck?.trim()) {
        toast({
          title: t("common.error"),
          description: t("settings.recipientEmailRequired"),
          variant: "destructive",
        });
        return;
      }
      performToggle(tpl, source);
    }
  };

  const performToggle = async (
    tpl: EmailTemplate,
    source: "table" | "editor",
  ) => {
    const newEnabled = !tpl.enabled;
    const recipientEmail =
      source === "editor" ? editRecipientEmail : tpl.recipientEmail;
    try {
      const res = await apiService.updateEmailTemplate(tpl.templateKey, {
        subject: tpl.subject,
        htmlBody: tpl.htmlBody,
        enabled: newEnabled,
        recipientEmail,
      });
      if (res.success) {
        fetchEmailTemplates();
        if (source === "editor") setEditEnabled(newEnabled);
      } else {
        toast({
          title: t("common.error"),
          description: res.message || t("settings.templateSaveError"),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("common.error"),
        description: t("settings.templateSaveError"),
        variant: "destructive",
      });
    }
  };

  const confirmDisableTemplate = () => {
    if (pendingDisableTemplate) {
      performToggle(pendingDisableTemplate, disableSource);
    }
    setDisableConfirmOpen(false);
    setPendingDisableTemplate(null);
  };

  const marginDirty =
    customMarginPercentage !== savedMarginPercentage ||
    marginMode !== savedMarginMode;

  const globalAdminDirty =
    globalAdminEmail !== savedGlobalAdminEmail ||
    ccGlobalAdmin !== savedCcGlobalAdmin;

  const handleMarginModeChange = (mode: "fallback" | "override") => {
    if (mode === "override" && savedMarginMode !== "override") {
      setOverrideConfirmOpen(true);
    } else {
      setMarginMode(mode);
    }
  };

  const confirmOverrideMode = () => {
    setMarginMode("override");
    setOverrideConfirmOpen(false);
  };

  // ============ Render helpers ============

  const templateKeyLabels: Record<string, string> = {
    password_reset: t("settings.templatePasswordReset"),
    offer_sent: t("settings.templateOfferSent"),
    order_confirmation: t("settings.templateOrderConfirmation"),
    order_status_update: t("settings.templateOrderStatusUpdate"),
    offer_accepted_admin: t("settings.templateOfferAcceptedAdmin"),
    offer_rejected_admin: t("settings.templateOfferRejectedAdmin"),
    offer_accepted_customer: t("settings.templateOfferAcceptedCustomer"),
    offer_rejected_customer: t("settings.templateOfferRejectedCustomer"),
  };

  // ============ JSX ============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("settings.subtitle")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="costs" className="text-xs sm:text-sm">
            <Calculator className="h-4 w-4 mr-1.5 hidden sm:inline" />
            {t("settings.tabCosts")}
          </TabsTrigger>
          <TabsTrigger value="email" className="text-xs sm:text-sm">
            <Mail className="h-4 w-4 mr-1.5 hidden sm:inline" />
            {t("settings.tabEmail")}
          </TabsTrigger>
        </TabsList>

        {/* ============= COST / MARGIN TAB ============= */}
        <TabsContent value="costs" className="space-y-4">
          {customMarginLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Margin Percentage Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <Percent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>{t("settings.customMarginTitle")}</CardTitle>
                      <CardDescription>
                        {t("settings.customMarginDesc")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <div className="space-y-2 flex-1 max-w-xs">
                      <Label>{t("settings.customMarginPercentage")}</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={marginPercentageDisplay}
                          onChange={e => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              /^\d{0,3}([.,]\d{0,2})?$/.test(val)
                            ) {
                              const display =
                                marginPercentageDisplay === "0" &&
                                val.length > 1 &&
                                !val.startsWith("0.") &&
                                !val.startsWith("0,")
                                  ? val.replace(/^0+/, "") || "0"
                                  : val;
                              const num = parseEuroNumber(display);
                              if (display === "" || display === "0") {
                                setMarginPercentageDisplay(display || "0");
                                setCustomMarginPercentage(0);
                              } else if (!isNaN(num) && num <= 100) {
                                setMarginPercentageDisplay(display);
                                setCustomMarginPercentage(num);
                              }
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseEuroNumber(
                              marginPercentageDisplay,
                            );
                            setMarginPercentageDisplay(String(parsed));
                          }}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Margin Mode Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                      <Calculator className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle>{t("settings.marginModeLabel")}</CardTitle>
                      <CardDescription>
                        {t("settings.marginModeDesc")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Fallback Card */}
                    <button
                      type="button"
                      onClick={() => handleMarginModeChange("fallback")}
                      className={`relative rounded-lg border-2 p-5 text-left transition-all ${
                        marginMode === "fallback"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30"
                      }`}
                    >
                      {marginMode === "fallback" && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck
                          className={`h-5 w-5 ${
                            marginMode === "fallback"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p className="font-semibold text-sm">
                          {t("settings.marginModeFallback")}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("settings.marginModeFallbackDesc")}
                      </p>
                    </button>

                    {/* Override Card */}
                    <button
                      type="button"
                      onClick={() => handleMarginModeChange("override")}
                      className={`relative rounded-lg border-2 p-5 text-left transition-all ${
                        marginMode === "override"
                          ? "border-amber-500 bg-amber-50 shadow-sm"
                          : "border-muted hover:border-muted-foreground/30 hover:bg-muted/30"
                      }`}
                    >
                      {marginMode === "override" && (
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center justify-center h-5 w-5 rounded-full bg-amber-500">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert
                          className={`h-5 w-5 ${
                            marginMode === "override"
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p className="font-semibold text-sm">
                          {t("settings.marginModeOverride")}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("settings.marginModeOverrideDesc")}
                      </p>
                      {marginMode === "override" && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-100 rounded-md px-2.5 py-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span>{t("settings.overrideActiveWarning")}</span>
                        </div>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Save Bar */}
              <div
                className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all ${
                  marginDirty
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted bg-muted/30"
                }`}
              >
                <p className="text-sm text-muted-foreground">
                  {marginDirty
                    ? t("settings.unsavedChanges")
                    : t("settings.allChangesSaved")}
                </p>
                <Button
                  onClick={handleSaveCustomMargin}
                  disabled={customMarginSaving || !marginDirty}
                  size="sm"
                >
                  {customMarginSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t("common.save")}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ============= EMAIL TAB ============= */}
        <TabsContent value="email" className="space-y-4">
          {/* Global Admin Email Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle>{t("settings.globalAdminEmailTitle")}</CardTitle>
                  <CardDescription>
                    {t("settings.globalAdminEmailDesc")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("settings.globalAdminEmailLabel")}</Label>
                <Input
                  type="email"
                  value={globalAdminEmail}
                  onChange={e => setGlobalAdminEmail(e.target.value)}
                  placeholder={t("settings.globalAdminEmailPlaceholder")}
                  disabled={!isSuperAdmin}
                  className="max-w-md"
                />
                {!isSuperAdmin && (
                  <p className="text-xs text-muted-foreground">
                    {t("settings.globalAdminEmailSuperadminOnly")}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t("settings.ccGlobalAdminLabel")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.ccGlobalAdminDesc")}
                  </p>
                </div>
                <Switch
                  checked={ccGlobalAdmin}
                  onCheckedChange={setCcGlobalAdmin}
                  disabled={!isSuperAdmin || !globalAdminEmail.trim()}
                />
              </div>

              {isSuperAdmin && (
                <div
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-all ${
                    globalAdminDirty
                      ? "border-primary/30 bg-primary/5"
                      : "border-muted bg-muted/30"
                  }`}
                >
                  <p className="text-sm text-muted-foreground">
                    {globalAdminDirty
                      ? t("settings.unsavedChanges")
                      : t("settings.allChangesSaved")}
                  </p>
                  <Button
                    onClick={handleSaveGlobalAdmin}
                    disabled={globalAdminSaving || !globalAdminDirty}
                    size="sm"
                  >
                    {globalAdminSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t("common.save")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Templates Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.emailTemplates")}</CardTitle>
              <CardDescription>
                {t("settings.emailTemplatesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : emailTemplates.length === 0 ? (
                <div className="border rounded-md p-6 text-center text-muted-foreground">
                  {t("settings.noTemplates")}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="border rounded-md hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">
                            {t("settings.templateName")}
                          </th>
                          <th className="text-left p-3 font-medium">
                            {t("settings.emailSubject")}
                          </th>
                          <th className="text-center p-3 font-medium hidden">
                            {t("common.status")}
                          </th>
                          <th className="text-right p-3 font-medium">
                            {t("common.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailTemplates.map(tpl => (
                          <tr key={tpl._id} className="border-b last:border-0">
                            <td className="p-3 font-medium">
                              {templateKeyLabels[tpl.templateKey] ??
                                tpl.templateKey}
                            </td>
                            <td className="p-3 text-muted-foreground truncate max-w-[200px]">
                              {tpl.subject}
                            </td>
                            <td className="p-3 text-center hidden">
                              <button
                                onClick={() =>
                                  requestToggleTemplate(tpl, "table")
                                }
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                                  tpl.enabled
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                              >
                                {tpl.enabled
                                  ? t("settings.enabled")
                                  : t("settings.disabled")}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openTemplateEditor(tpl)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-orange-600"
                                  onClick={() =>
                                    handleResetTemplate(tpl.templateKey)
                                  }
                                  title={t("settings.resetToDefault")}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {emailTemplates.map(tpl => (
                      <div
                        key={tpl._id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">
                              {templateKeyLabels[tpl.templateKey] ??
                                tpl.templateKey}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {tpl.subject}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openTemplateEditor(tpl)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600"
                              onClick={() =>
                                handleResetTemplate(tpl.templateKey)
                              }
                              title={t("settings.resetToDefault")}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={() => requestToggleTemplate(tpl, "table")}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                              tpl.enabled
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            {tpl.enabled
                              ? t("settings.enabled")
                              : t("settings.disabled")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============= DIALOGS ============= */}

      {/* Email Template Editor Dialog */}
      <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              {editingTemplate
                ? `${t("settings.editTemplate")}: ${templateKeyLabels[editingTemplate.templateKey] ?? editingTemplate.templateKey}`
                : t("settings.editTemplate")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Description / available variables */}
            {editingTemplate?.description && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                <strong>{t("settings.availableVariables")}:</strong>{" "}
                {editingTemplate.description}
              </div>
            )}

            {/* Enabled toggle */}
            <div className="flex items-center gap-3">
              <Label>{t("common.status")}:</Label>
              <button
                onClick={() => {
                  if (editingTemplate) {
                    requestToggleTemplate(
                      { ...editingTemplate, enabled: editEnabled },
                      "editor",
                    );
                  }
                }}
                className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                  editEnabled
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {editEnabled ? t("settings.enabled") : t("settings.disabled")}
              </button>
            </div>

            {/* From Email — only for admin notification templates */}
            {editingTemplate &&
              isAdminTemplate(editingTemplate.templateKey) && (
                <div className="space-y-2">
                  <Label>
                    {t("settings.recipientEmail")}{" "}
                    {editEnabled && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    type="email"
                    value={editRecipientEmail}
                    onChange={e => {
                      // Prevent clearing recipient email when template is enabled
                      if (
                        editEnabled &&
                        !e.target.value.trim() &&
                        editRecipientEmail.trim()
                      ) {
                        toast({
                          title: t("common.error"),
                          description: t("settings.recipientEmailCannotClear"),
                          variant: "destructive",
                        });
                        return;
                      }
                      setEditRecipientEmail(e.target.value);
                    }}
                    placeholder={t("settings.recipientEmailPlaceholder")}
                    className={
                      editEnabled && !editRecipientEmail.trim()
                        ? "border-red-300 focus-visible:ring-red-400"
                        : ""
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("settings.recipientEmailHelp")}
                  </p>
                </div>
              )}

            {/* Subject */}
            <div className="space-y-2">
              <Label>{t("settings.emailSubject")}</Label>
              <Input
                value={editSubject}
                onChange={e => setEditSubject(e.target.value)}
                placeholder={t("settings.subjectPlaceholder")}
              />
            </div>

            {/* Toggle between editor and preview */}
            <div className="flex items-center gap-2">
              <Button
                variant={!showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <Code className="h-4 w-4 mr-1" />
                {t("settings.htmlEditor")}
              </Button>
              <Button
                variant={showPreview ? "default" : "outline"}
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-1" />
                {t("settings.preview")}
              </Button>
            </div>

            {/* HTML Body Editor or Preview */}
            {!showPreview ? (
              <div className="space-y-2">
                <Label>{t("settings.templateBody")}</Label>
                <HighlightedEditor
                  value={editHtmlBody}
                  onChange={setEditHtmlBody}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t("settings.preview")}</Label>
                <div className="border rounded-md bg-white">
                  <iframe
                    srcDoc={editHtmlBody}
                    title="Email Preview"
                    className="w-full h-80 rounded-md"
                    sandbox=""
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() =>
                editingTemplate &&
                handleResetTemplate(editingTemplate.templateKey)
              }
              className="max-sm:mt-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t("settings.resetToDefault")}
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateEditorOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSaveTemplate} disabled={savingTemplate}>
                {savingTemplate && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {t("common.save")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Override Mode AlertDialog */}
      <AlertDialog
        open={overrideConfirmOpen}
        onOpenChange={setOverrideConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("settings.overrideConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.overrideConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmOverrideMode}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {t("settings.overrideConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Disable Template AlertDialog */}
      <AlertDialog
        open={disableConfirmOpen}
        onOpenChange={setDisableConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.disableTemplateTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.disableTemplateWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDisableTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.disableTemplateConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
