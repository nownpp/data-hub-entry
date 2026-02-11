import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  LogOut,
  Users,
  Trash2,
  RefreshCw,
  UserPlus,
  Copy,
  Lock,
  Check,
  X,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SettingsCard from "@/components/admin/SettingsCard";
import FinancialStatsCards from "@/components/admin/FinancialStatsCards";
import CollectorFinanceTable from "@/components/admin/CollectorFinanceTable";

interface Submission {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
  collector_name: string | null;
  is_delivered: boolean;
  batch_id: string | null;
}

interface Collector {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface Batch {
  id: string;
  collector_name: string;
  is_delivered: boolean;
  submissions_count: number;
  total_amount: number;
  commission_amount: number;
  net_amount: number;
  created_at: string;
  delivered_at: string | null;
}

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCollectorName, setNewCollectorName] = useState("");
  const [newCollectorPassword, setNewCollectorPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"submissions" | "batches" | "collectors" | "finance">("submissions");
  const [filterCollector, setFilterCollector] = useState<string | null>(null);
  const [servicePrice, setServicePrice] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const navigate = useNavigate();

  const fetchSubmissions = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("حدث خطأ في تحميل البيانات");
      setIsLoading(false);
      return;
    }
    setSubmissions(data || []);
    setIsLoading(false);
  };

  const fetchCollectors = async () => {
    const { data, error } = await supabase
      .from("collectors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("حدث خطأ في تحميل المُدخلين");
      return;
    }
    setCollectors(data || []);
  };

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("حدث خطأ في تحميل الدفعات");
      return;
    }
    setBatches(data || []);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("system_settings")
      .select("key, value");

    if (data) {
      data.forEach((s) => {
        if (s.key === "service_price") setServicePrice(parseFloat(s.value) || 0);
        if (s.key === "commission_amount") setCommissionAmount(parseFloat(s.value) || 0);
      });
    }
  };

  const fetchAll = async () => {
    await Promise.all([fetchSubmissions(), fetchCollectors(), fetchBatches(), fetchSettings()]);
  };

  const handleDeleteSubmission = async (id: string) => {
    const { error } = await supabase.from("submissions").delete().eq("id", id);
    if (error) {
      toast.error("حدث خطأ أثناء الحذف");
      return;
    }
    toast.success("تم حذف السجل بنجاح");
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleToggleBatchDelivery = async (batch: Batch) => {
    const newStatus = !batch.is_delivered;

    // Update batch
    const { error: batchErr } = await supabase
      .from("batches")
      .update({
        is_delivered: newStatus,
        delivered_at: newStatus ? new Date().toISOString() : null,
      })
      .eq("id", batch.id);

    if (batchErr) {
      toast.error("حدث خطأ في تحديث الدفعة");
      return;
    }

    // Update all submissions in this batch
    const { error: subErr } = await supabase
      .from("submissions")
      .update({ is_delivered: newStatus })
      .eq("batch_id", batch.id);

    if (subErr) {
      toast.error("حدث خطأ في تحديث التسجيلات");
      return;
    }

    toast.success(newStatus ? "تم تأكيد توريد الدفعة" : "تم إلغاء توريد الدفعة");
    fetchAll();
  };

  const handleAddCollector = async () => {
    const name = newCollectorName.trim();
    const password = newCollectorPassword.trim();
    if (!name) {
      toast.error("يرجى إدخال اسم المُدخل");
      return;
    }
    if (!password || password.length < 4) {
      toast.error("كلمة المرور يجب أن تكون 4 أحرف على الأقل");
      return;
    }

    const { data, error } = await supabase.functions.invoke("collector-auth", {
      body: { action: "create", name, password },
    });

    if (error || data?.error) {
      toast.error(data?.error || "حدث خطأ أثناء الإضافة");
      return;
    }

    toast.success("تم إضافة المُدخل بنجاح");
    setNewCollectorName("");
    setNewCollectorPassword("");
    fetchCollectors();
  };

  const handleToggleCollector = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("collectors")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast.error("حدث خطأ");
      return;
    }

    toast.success(currentActive ? "تم تعطيل المُدخل" : "تم تفعيل المُدخل");
    fetchCollectors();
  };

  const handleDeleteCollector = async (id: string) => {
    const { error } = await supabase.from("collectors").delete().eq("id", id);
    if (error) {
      toast.error("حدث خطأ أثناء الحذف");
      return;
    }
    toast.success("تم حذف المُدخل");
    fetchCollectors();
  };

  const copyCollectorLink = (name: string) => {
    const link = `${window.location.origin}/?collector=${encodeURIComponent(name)}`;
    navigator.clipboard.writeText(link);
    toast.success("تم نسخ الرابط");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin");
        return;
      }
      fetchAll();
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const collectorStats = collectors
    .map((c) => ({
      name: c.name,
      count: submissions.filter((s) => s.collector_name === c.name).length,
    }))
    .sort((a, b) => b.count - a.count);

  const filteredSubmissions = filterCollector
    ? submissions.filter((s) => s.collector_name === filterCollector)
    : submissions;

  const deliveredCount = submissions.filter((s) => s.is_delivered).length;
  const undeliveredCount = submissions.length - deliveredCount;

  const filteredBatches = filterCollector
    ? batches.filter((b) => b.collector_name === filterCollector)
    : batches;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">لوحة المسؤول</h1>
              <p className="text-sm text-muted-foreground">إدارة البيانات والمُدخلين والمالية</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchAll} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>

        {/* Financial Stats */}
        <FinancialStatsCards
          totalSubmissions={submissions.length}
          collectorsCount={collectors.length}
          servicePrice={servicePrice}
          commissionAmount={commissionAmount}
          deliveredCount={deliveredCount}
          undeliveredCount={undeliveredCount}
        />

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0 overflow-x-auto">
          {(
            [
              { key: "submissions", label: "البيانات المسجلة" },
              { key: "batches", label: `الدفعات (${batches.length})` },
              { key: "finance", label: "المالية" },
              { key: "collectors", label: "إدارة المُدخلين" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key !== "submissions" && tab.key !== "batches") setFilterCollector(null);
              }}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-card text-foreground border border-border border-b-card -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="space-y-4 animate-fade-in">
            {collectorStats.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">إحصائيات المُدخلين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterCollector(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        !filterCollector
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      الكل ({submissions.length})
                    </button>
                    {collectorStats.map((stat) => (
                      <button
                        key={stat.name}
                        onClick={() => setFilterCollector(stat.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          filterCollector === stat.name
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {stat.name} ({stat.count})
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">
                  {filterCollector ? `بيانات: ${filterCollector}` : "جميع البيانات المسجلة"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    جاري تحميل البيانات...
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد بيانات مسجلة بعد</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right font-semibold">#</TableHead>
                          <TableHead className="text-right font-semibold">الاسم</TableHead>
                          <TableHead className="text-right font-semibold">رقم الهاتف</TableHead>
                          <TableHead className="text-right font-semibold">المُدخل</TableHead>
                          <TableHead className="text-right font-semibold">التوريد</TableHead>
                          <TableHead className="text-right font-semibold">التاريخ</TableHead>
                          <TableHead className="text-right font-semibold">إجراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubmissions.map((submission, index) => (
                          <TableRow key={submission.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell
                              className="font-medium cursor-pointer hover:text-primary transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(submission.full_name);
                                toast.success("تم نسخ الاسم");
                              }}
                              title="انقر للنسخ"
                            >
                              <span className="flex items-center gap-1">
                                {submission.full_name}
                                <Copy className="w-3 h-3 opacity-30" />
                              </span>
                            </TableCell>
                            <TableCell
                              dir="ltr"
                              className="text-left cursor-pointer hover:text-primary transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(submission.phone_number);
                                toast.success("تم نسخ رقم الهاتف");
                              }}
                              title="انقر للنسخ"
                            >
                              <span className="flex items-center gap-1">
                                {submission.phone_number}
                                <Copy className="w-3 h-3 opacity-30" />
                              </span>
                            </TableCell>
                            <TableCell>
                              {submission.collector_name ? (
                                <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                                  {submission.collector_name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                  submission.is_delivered
                                    ? "bg-success/10 text-success"
                                    : submission.batch_id
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {submission.is_delivered ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" /> تم التوريد
                                  </span>
                                ) : submission.batch_id ? (
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" /> في دفعة
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <X className="w-3 h-3" /> غير مجمّع
                                  </span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(submission.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSubmission(submission.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === "batches" && (
          <div className="space-y-4 animate-fade-in">
            {collectorStats.length > 0 && (
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">فلترة حسب المُدخل</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterCollector(null)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        !filterCollector
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      الكل ({batches.length})
                    </button>
                    {collectorStats.map((stat) => {
                      const bCount = batches.filter((b) => b.collector_name === stat.name).length;
                      return (
                        <button
                          key={stat.name}
                          onClick={() => setFilterCollector(stat.name)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            filterCollector === stat.name
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {stat.name} ({bCount})
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  الدفعات ({filteredBatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredBatches.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد دفعات بعد</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right font-semibold">#</TableHead>
                          <TableHead className="text-right font-semibold">المُدخل</TableHead>
                          <TableHead className="text-right font-semibold">عدد التسجيلات</TableHead>
                          <TableHead className="text-right font-semibold">المبلغ الكلي</TableHead>
                          <TableHead className="text-right font-semibold">العمولة</TableHead>
                          <TableHead className="text-right font-semibold">صافي التوريد</TableHead>
                          <TableHead className="text-right font-semibold">الحالة</TableHead>
                          <TableHead className="text-right font-semibold">التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBatches.map((batch, index) => (
                          <TableRow key={batch.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">{batch.collector_name}</TableCell>
                            <TableCell className="font-bold text-primary">
                              {batch.submissions_count}
                            </TableCell>
                            <TableCell>{batch.total_amount}</TableCell>
                            <TableCell className="text-success font-semibold">
                              {batch.commission_amount}
                            </TableCell>
                            <TableCell className="font-semibold">{batch.net_amount}</TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleToggleBatchDelivery(batch)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                  batch.is_delivered
                                    ? "bg-success/10 text-success"
                                    : "bg-destructive/10 text-destructive"
                                }`}
                              >
                                {batch.is_delivered ? (
                                  <span className="flex items-center gap-1">
                                    <Check className="w-3 h-3" /> تم التوريد
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <X className="w-3 h-3" /> معلّق
                                  </span>
                                )}
                              </button>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(batch.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Finance Tab */}
        {activeTab === "finance" && (
          <div className="space-y-4 animate-fade-in">
            <SettingsCard
              servicePrice={servicePrice}
              commissionAmount={commissionAmount}
              onSettingsUpdated={fetchSettings}
            />
            <CollectorFinanceTable
              collectors={collectors}
              submissions={submissions}
              servicePrice={servicePrice}
              commissionAmount={commissionAmount}
            />
          </div>
        )}

        {/* Collectors Tab */}
        {activeTab === "collectors" && (
          <div className="space-y-4 animate-fade-in">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">إضافة مُدخل جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    value={newCollectorName}
                    onChange={(e) => setNewCollectorName(e.target.value)}
                    placeholder="اسم المُدخل"
                    className="text-right"
                    maxLength={50}
                  />
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={newCollectorPassword}
                      onChange={(e) => setNewCollectorPassword(e.target.value)}
                      placeholder="كلمة المرور"
                      type="password"
                      className="pr-10 text-right"
                      maxLength={50}
                      dir="ltr"
                    />
                  </div>
                  <Button onClick={handleAddCollector} className="gap-2 shrink-0">
                    <UserPlus className="w-4 h-4" />
                    إضافة
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">المُدخلين ({collectors.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {collectors.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>لم يتم إضافة مُدخلين بعد</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right font-semibold">الاسم</TableHead>
                          <TableHead className="text-right font-semibold">عدد التسجيلات</TableHead>
                          <TableHead className="text-right font-semibold">الحالة</TableHead>
                          <TableHead className="text-right font-semibold">الرابط</TableHead>
                          <TableHead className="text-right font-semibold">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collectors.map((collector) => {
                          const count = submissions.filter(
                            (s) => s.collector_name === collector.name
                          ).length;
                          return (
                            <TableRow key={collector.id} className="hover:bg-muted/30 transition-colors">
                              <TableCell className="font-medium">{collector.name}</TableCell>
                              <TableCell>
                                <span className="font-bold text-primary text-lg">{count}</span>
                              </TableCell>
                              <TableCell>
                                <button
                                  onClick={() =>
                                    handleToggleCollector(collector.id, collector.is_active)
                                  }
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    collector.is_active
                                      ? "bg-success/10 text-success"
                                      : "bg-destructive/10 text-destructive"
                                  }`}
                                >
                                  {collector.is_active ? "مفعّل" : "معطّل"}
                                </button>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyCollectorLink(collector.name)}
                                  className="gap-1 text-xs"
                                >
                                  <Copy className="w-3 h-3" />
                                  نسخ الرابط
                                </Button>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteCollector(collector.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
