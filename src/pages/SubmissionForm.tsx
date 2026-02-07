import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Phone, CheckCircle2, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";

const submissionSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100, "الاسم طويل جداً"),
  phone_number: z.string().trim().min(8, "رقم الهاتف غير صحيح").max(20, "رقم الهاتف طويل جداً").regex(/^[\d+\-\s()]+$/, "رقم الهاتف يحتوي على أحرف غير صالحة"),
});

const SubmissionForm = () => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("حدث خطأ أثناء الإرسال. حاول مرة أخرى.");
      return;
    }

    setIsSuccess(true);
    setFullName("");
    setPhoneNumber("");
    toast.success("تم إرسال البيانات بنجاح!");
  };

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
      <Link
        to="/admin"
        className="absolute top-4 left-4 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm flex items-center gap-1"
      >
        <ClipboardList className="w-4 h-4" />
        دخول المسؤول
      </Link>

      <Card className="w-full max-w-md shadow-glow animate-fade-up border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <ClipboardList className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل البيانات</CardTitle>
          <CardDescription className="text-base">
            يرجى إدخال بياناتك في الحقول أدناه
          </CardDescription>
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
