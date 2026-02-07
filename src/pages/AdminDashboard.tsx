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
import { LogOut, Users, Trash2, RefreshCw, UserPlus, Link2, Copy, BarChart3 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface Submission {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
  collector_name: string | null;
}

interface Collector {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface CollectorStats {
  name: string;
  count: number;
}

const AdminDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCollectorName, setNewCollectorName] = useState("");
  const [activeTab, setActiveTab] = useState<"submissions" | "collectors">("submissions");
  const [filterCollector, setFilterCollector] = useState<string | null>(null);
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

  const fetchAll = async () => {
    await Promise.all([fetchSubmissions(), fetchCollectors()]);
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

  const handleAddCollector = async () => {
    const name = newCollectorName.trim();
    if (!name) {
      toast.error("يرجى إدخال اسم المُدخل");
      return;
    }

    const { error } = await supabase.from("collectors").insert({ name });
    if (error) {
      if (error.code === "23505") {
        toast.error("هذا الاسم موجود بالفعل");
      } else {
        toast.error("حدث خطأ أثناء الإضافة");
      }
      return;
    }

    toast.success("تم إضافة المُدخل بنجاح");
    setNewCollectorName("");
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

  // Calculate collector stats
  const collectorStats: CollectorStats[] = collectors.map((c) => ({
    name: c.name,
    count: submissions.filter((s) => s.collector_name === c.name).length,
  })).sort((a, b) => b.count - a.count);

  const unknownCount = submissions.filter((s) => !s.collector_name).length;

  const filteredSubmissions = filterCollector
    ? submissions.filter((s) => s.collector_name === filterCollector)
    : submissions;

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
              <p className="text-sm text-muted-foreground">إدارة البيانات والمُدخلين</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAll}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up">
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">إجمالي التسجيلات</p>
                  <p className="text-2xl font-bold text-foreground">{submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">عدد المُدخلين</p>
                  <p className="text-2xl font-bold text-foreground">{collectors.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">بدون مُدخل</p>
                  <p className="text-2xl font-bold text-foreground">{unknownCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-0">
          <button
            onClick={() => { setActiveTab("submissions"); setFilterCollector(null); }}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "submissions"
                ? "bg-card text-foreground border border-border border-b-card -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            البيانات المسجلة
          </button>
          <button
            onClick={() => setActiveTab("collectors")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "collectors"
                ? "bg-card text-foreground border border-border border-b-card -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            إدارة المُدخلين
          </button>
        </div>

        {/* Submissions Tab */}
        {activeTab === "submissions" && (
          <div className="space-y-4 animate-fade-in">
            {/* Collector Stats Summary */}
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

            {/* Submissions Table */}
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
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-right font-semibold">#</TableHead>
                          <TableHead className="text-right font-semibold">الاسم</TableHead>
                          <TableHead className="text-right font-semibold">رقم الهاتف</TableHead>
                          <TableHead className="text-right font-semibold">المُدخل</TableHead>
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
                            <TableCell className="font-medium">{submission.full_name}</TableCell>
                            <TableCell dir="ltr" className="text-left">{submission.phone_number}</TableCell>
                            <TableCell>
                              {submission.collector_name ? (
                                <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs font-medium">
                                  {submission.collector_name}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
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

        {/* Collectors Tab */}
        {activeTab === "collectors" && (
          <div className="space-y-4 animate-fade-in">
            {/* Add Collector */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">إضافة مُدخل جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    value={newCollectorName}
                    onChange={(e) => setNewCollectorName(e.target.value)}
                    placeholder="اسم المُدخل"
                    className="text-right"
                    maxLength={50}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCollector()}
                  />
                  <Button onClick={handleAddCollector} className="gap-2 shrink-0">
                    <UserPlus className="w-4 h-4" />
                    إضافة
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Collectors List */}
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
                                  onClick={() => handleToggleCollector(collector.id, collector.is_active)}
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
