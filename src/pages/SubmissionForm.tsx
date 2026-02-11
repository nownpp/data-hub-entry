import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Phone, CheckCircle2, ClipboardList, BarChart3, Lock } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";

const submissionSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
  phone_number: z.string().trim().min(8, "رقم الهاتف غير صحيح").max(20, "رقم الهاتف طويل جداً").regex(/^[\d+\-\s()]+$/, "رقم الهاتف يحتوي على أحرف غير صالحة"),
});

const SubmissionForm = () => {
  const saved = JSON.parse(localStorage.getItem("rememberMe") || "null");
  const [fullName, setFullName] = useState(saved?.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(saved?.phoneNumber || "");
  const [rememberMe, setRememberMe] = useState(!!saved);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [myCount, setMyCount] = useState(0);
  const [collectorValid, setCollectorValid] = useState<boolean | null>(null);

  const [searchParams] = useSearchParams();
  const collectorName = searchParams.get("collector");

  // Validate collector and fetch their count
  useEffect(() => {
    if (!collectorName) {
      setCollectorValid(null);
      return;
    }

    const validateAndCount = async () => {
      // Validate collector exists
      const { data: collector } = await supabase
        .from("collectors")
        .select("name")
        .eq("name", collectorName)
        .eq("is_active", true)
        .maybeSingle();

      if (!collector) {
        setCollectorValid(false);
        return;
      }

      setCollectorValid(true);
      fetchMyCount();
    };

    validateAndCount();
  }, [collectorName]);

  const fetchMyCount = async () => {
    if (!collectorName) return;
    const { count } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("collector_name", collectorName);
    setMyCount(count || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = submissionSchema.safeParse({ full_name: fullName, phone_number: phoneNumber });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("submissions").insert({
      full_name: validation.data.full_name,
      phone_number: validation.data.phone_number,
      collector_name: collectorName || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("حدث خطأ أثناء الإرسال. حاول مرة أخرى.");
      return;
    }

    if (rememberMe) {
      localStorage.setItem("rememberMe", JSON.stringify({ fullName: validation.data.full_name, phoneNumber: validation.data.phone_number }));
    } else {
      localStorage.removeItem("rememberMe");
    }

    setIsSuccess(true);
    setFullName("");
    setPhoneNumber("");
    setMyCount((prev) => prev + 1);
    toast.success("تم إرسال البيانات بنجاح!");
  };

  // Invalid collector
  if (collectorName && collectorValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <Card className="w-full max-w-md shadow-glow animate-fade-up border-0">
          <CardContent className="pt-12 pb-10 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">رابط غير صالح</h2>
              <p className="text-muted-foreground">هذا الرابط غير موجود أو تم تعطيله.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
        <Card className="w-full max-w-md shadow-glow animate-fade-up border-0">
          <CardContent className="pt-12 pb-10 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">تم الإرسال بنجاح!</h2>
              <p className="text-muted-foreground">شكراً لك، تم حفظ بياناتك.</p>
            </div>
            {collectorName && (
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm text-muted-foreground">إجمالي تسجيلاتك</p>
                <p className="text-3xl font-bold text-primary">{myCount}</p>
              </div>
            )}
            <Button
              onClick={() => setIsSuccess(false)}
              className="w-full"
              size="lg"
            >
              إرسال بيانات أخرى
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero relative">
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <Link
          to="/"
          className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm flex items-center gap-1"
        >
          <ClipboardList className="w-4 h-4" />
          دخول المُدخل
        </Link>
        <Link
          to="/admin"
          className="text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm flex items-center gap-1"
        >
          <Lock className="w-4 h-4" />
          المسؤول
        </Link>
      </div>

      <Card className="w-full max-w-md shadow-glow animate-fade-up border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <ClipboardList className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل البيانات</CardTitle>
          <CardDescription className="text-base">
            يرجى إدخال بياناتك في الحقول أدناه
          </CardDescription>
          {collectorName && collectorValid && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <div className="bg-secondary rounded-lg px-4 py-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">المُدخل:</span>
                <span className="font-semibold text-foreground">{collectorName}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-bold text-primary">{myCount}</span>
                <span className="text-sm text-muted-foreground">تسجيل</span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="أدخل اسمك الكامل"
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
                  placeholder="أدخل رقم هاتفك"
                  className="pr-10 text-right"
                  type="tel"
                  required
                  maxLength={20}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer">
                تذكرني
              </Label>
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => {
                  setRememberMe(!!checked);
                  if (!checked) localStorage.removeItem("rememberMe");
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال البيانات"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionForm;
