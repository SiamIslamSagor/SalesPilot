import { useState, useEffect, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  ArrowLeft,
  KeyRound,
  Search,
  X,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import apiService from "@/services/api";
import { useSortable } from "@/hooks/useSortable";
import { SortableHeader } from "@/components/SortableHeader";

interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  createdAt: string;
  updatedAt: string;
  lastPasswordReset?: string;
  id: string;
}

export default function Users() {
  const { addUser, updateUser, removeUser, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "admin" as "admin" | "superadmin",
  });
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<ApiUser | null>(null);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const {
    sorted: sortedUsers,
    sortKey: userSortKey,
    sortDir: userSortDir,
    handleSort: handleUserSort,
  } = useSortable<ApiUser>(filteredUsers);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.fetchUsers();
      if ("success" in response && response.success) {
        const mappedUsers: ApiUser[] = response.data.map((user: ApiUser) => ({
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: new Date(user.createdAt).toLocaleDateString(),
          updatedAt: new Date(user.updatedAt).toLocaleDateString(),
          lastPasswordReset: user.lastPasswordReset
            ? new Date(user.lastPasswordReset).toLocaleDateString()
            : "Never",
        }));
        setUsers(mappedUsers);
      } else {
        setError(
          "success" in response ? response.message : t("users.fetchError"),
        );
      }
    } catch (err) {
      setError(t("users.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: ApiUser) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, role: u.role });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (editingUser) {
      updateUser(editingUser.id, {
        name: form.name,
        email: form.email,
        role: form.role,
      });
      toast({ title: t("users.userUpdatedToast") });
    }
    setDialogOpen(false);
  };

  const handleDelete = async (u: ApiUser) => {
    if (u.id === currentUser?.id || deletingUserId) return;
    setDeletingUserId(u.id);
    try {
      const response = await apiService.deleteUser(u.id);
      if (response.success) {
        removeUser(u.id);
        setUsers(prev => prev.filter(user => user.id !== u.id));
        toast({ title: t("users.userRemovedToast") });
      } else {
        toast({
          title: t("users.deleteFailed"),
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("users.deleteFailed"),
        description: t("users.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const openResetPassword = (u: ApiUser) => {
    setResettingUser(u);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resettingUser) return;

    setResetPasswordLoading(true);
    try {
      const response = await apiService.forgotPassword(resettingUser.email);

      if (response.success) {
        toast({
          title: t("users.passwordResetLinkSent"),
          description: `${t("users.passwordResetLinkSentDesc")} ${resettingUser.email}`,
        });
        setResetPasswordDialogOpen(false);
      } else {
        toast({
          title: t("users.failedToSendResetLink"),
          description: response.message || t("users.errorOccurred"),
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: t("users.failedToSendResetLink"),
        description: t("users.unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setResetPasswordLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold">{t("users.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {search || roleFilter !== "all"
              ? `${filteredUsers.length} / ${users.length} ${t("users.userCount")}`
              : `${users.length} ${t("users.userCount")}`}
          </p>
        </div>
        <Link to="/users/new">
          <Button>
            <Plus size={16} className="mr-2" /> {t("users.addUser")}
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={t("users.searchPlaceholder")}
            className="pl-9 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("users.allRoles")}</SelectItem>
            <SelectItem value="admin">{t("users.admin")}</SelectItem>
            <SelectItem value="superadmin">{t("users.superAdmin")}</SelectItem>
          </SelectContent>
        </Select>
        {(search || roleFilter !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setRoleFilter("all");
            }}
            className="flex items-center gap-1"
          >
            <X size={14} />
            {t("filters.clearAll")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t("users.loadingUsers")}</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchUsers} variant="outline">
            {t("users.retry")}
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">{t("users.noUsersFound")}</p>
          <Link to="/users/new">
            <Button>
              <Plus size={16} className="mr-2" /> {t("users.addUser")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <SortableHeader
                    label={t("common.name")}
                    sortKey="name"
                    currentKey={userSortKey as string | null}
                    direction={userSortDir}
                    onClick={k => handleUserSort(k as keyof ApiUser)}
                  />
                  <SortableHeader
                    label={t("common.email")}
                    sortKey="email"
                    currentKey={userSortKey as string | null}
                    direction={userSortDir}
                    onClick={k => handleUserSort(k as keyof ApiUser)}
                  />
                  <SortableHeader
                    label={t("common.role")}
                    sortKey="role"
                    currentKey={userSortKey as string | null}
                    direction={userSortDir}
                    onClick={k => handleUserSort(k as keyof ApiUser)}
                  />
                  <SortableHeader
                    label={t("common.created")}
                    sortKey="createdAt"
                    currentKey={userSortKey as string | null}
                    direction={userSortDir}
                    onClick={k => handleUserSort(k as keyof ApiUser)}
                  />
                  <SortableHeader
                    label={t("common.updated")}
                    sortKey="updatedAt"
                    currentKey={userSortKey as string | null}
                    direction={userSortDir}
                    onClick={k => handleUserSort(k as keyof ApiUser)}
                  />
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    {t("common.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map(u => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        {u.role === "superadmin" ? (
                          <ShieldCheck size={14} className="text-primary" />
                        ) : (
                          <Shield size={14} className="text-muted-foreground" />
                        )}
                        {u.role === "superadmin"
                          ? t("users.superAdmin")
                          : t("users.admin")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.createdAt}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.updatedAt}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil size={14} />
                        </Button>
                        {u.role !== "superadmin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openResetPassword(u)}
                            title={t("users.resetPassword")}
                          >
                            <KeyRound size={14} />
                          </Button>
                        )}
                        {u.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(u)}
                            disabled={deletingUserId === u.id}
                          >
                            {deletingUserId === u.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.editUser")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">{t("common.name")}</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t("common.email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{t("common.role")}</Label>
              <Select
                value={form.role}
                onValueChange={(v: "admin" | "superadmin") =>
                  setForm({ ...form, role: v })
                }
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSave}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={setResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("users.sendPasswordResetLink")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium">
                {t("users.userLabel")} {resettingUser?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {resettingUser?.email}
              </p>
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={resettingUser?.email}
                disabled
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("users.passwordResetLinkWillBeSent")}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t("users.whatHappensNext")}
              </p>
              <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>User will receive an email with a reset link</li>
                <li>They can click the link to reset their password</li>
                <li>They will be redirected to the reset page</li>
                <li>They can set a new password</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetPasswordDialogOpen(false)}
              disabled={resetPasswordLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordLoading}
            >
              {resetPasswordLoading
                ? t("users.sending")
                : t("users.sendResetLink")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
