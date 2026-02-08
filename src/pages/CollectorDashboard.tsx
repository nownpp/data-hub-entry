import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  User,
  Phone,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const submissionSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100, "الاسم طويل جداً"),
  phone_number: z
    .string()
    .trim()
    .min(8, "رقم الهاتف غير صحيح")
    .max(20, "رقم الهاتف طويل جداً")
    .regex(/^[\d+\-\s()]+$/, "رقم الهاتف يحتوي على أحرف غير صالحة"),
});

interface Submission {
  id: string;
  full_name: string;
  phone_number: string;
  created_at: string;
}

const CollectorDashboard = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const collectorName = sessionStorage.getItem("collector_name");
  const collectorToken = sessionStorage.getItem("collector_token");

  const fetchSubmissions = useCallback(async () => {
    if (!collectorToken) return;
    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke("collector-data", {
      body: { token: collectorToken },
    });

    if (error || data?.error) {
      if (data?.error === "جلسة غير صالحة أو منتهية") {
        toast.error("انتهت الجلسة، يرجى تسجيل الدخول مجدداً");
        handleLogout();
        return;
      }
      toast.error("حدث خطأ في تحميل البيانات");
      setIsLoading(false);
      return;
    }

    setSubmissions(data.submissions || []);
    setIsLoading(false);
  }, [collectorToken]);

  useEffect(() => {
    if (!collectorName || !collectorToken) {
      navigate("/collector");
      return;
    }
    fetchSubmissions();
  }, [collectorName, collectorToken, navigate, fetchSubmissions]);

  const handleLogout = () => {
    sessionStorage.removeItem("collector_token");
    sessionStorage.removeItem("collector_name");
    sessionStorage.removeItem("collector_id");
    navigate("/collector");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = submissionSchema.safeParse({
      full_name: fullName,
      phone_number: phoneNumber,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("submissions").insert({
      full_name: validation.data.full_name,
      phone_number: validation.data.phone_number,
      collector_name: collectorName,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("حدث خطأ أثناء الإرسال. حاول مرة أخرى.");
      return;
    }

    setFullName("");
    setPhoneNumber("");
    setShowSuccess(true);
    toast.success("تم إرسال البيانات بنجاح!");
    setTimeout(() => setShowSuccess(false), 3000);
    fetchSubmissions();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
              <ClipboardList className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                أهلاً، {collectorName}
              </h1>
              <p className="text-sm text-muted-foreground">لوحة إدخال البيانات</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchSubmissions}
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

        {/* Stats */}
        <Card className="shadow-card animate-fade-up">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">إجمالي تسجيلاتك</p>
                <p className="text-3xl font-bold text-primary">
                  {submissions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card className="shadow-card animate-fade-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">إدخال بيانات جديدة</CardTitle>
            <CardDescription>أضف بيانات جديدة للتسجيل</CardDescription>
          </CardHeader>
          <CardContent>
            {showSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-success/10 flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">تم الإرسال بنجاح!</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    الاسم الكامل
                  </Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="أدخل الاسم الكامل"
                      className="pr-10 text-right"
                      required
                      maxLength={100}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium">
                    رقم الهاتف
                  </Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="أدخل رقم الهاتف"
                      className="pr-10 text-right"
                      type="tel"
                      required
                      maxLength={20}
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال البيانات"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card className="shadow-card animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg">
              سجل البيانات المُدخلة ({submissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                جاري تحميل البيانات...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لم تقم بإدخال أي بيانات بعد</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right font-semibold">#</TableHead>
                      <TableHead className="text-right font-semibold">الاسم</TableHead>
                      <TableHead className="text-right font-semibold">رقم الهاتف</TableHead>
                      <TableHead className="text-right font-semibold">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission, index) => (
                      <TableRow
                        key={submission.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {submission.full_name}
                        </TableCell>
                        <TableCell dir="ltr" className="text-left">
                          {submission.phone_number}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(submission.created_at)}
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
    </div>
  );
};

export default CollectorDashboard;
