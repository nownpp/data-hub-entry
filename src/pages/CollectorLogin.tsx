import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { User, Lock, ClipboardList } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const CollectorLogin = () => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password) {
      toast.error("يرجى إدخال الاسم وكلمة المرور");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke("collector-auth", {
      body: { action: "login", name: name.trim(), password },
    });

    setIsLoading(false);

    if (error || data?.error) {
      toast.error(data?.error || "حدث خطأ في تسجيل الدخول");
      return;
    }

    // Store session
    sessionStorage.setItem("collector_token", data.token);
    sessionStorage.setItem("collector_name", data.collector.name);
    sessionStorage.setItem("collector_id", data.collector.id);

    toast.success("تم تسجيل الدخول بنجاح");
    navigate("/collector/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero relative">
      <Link
        to="/submit"
        className="absolute top-4 right-4 text-primary-foreground/60 hover:text-primary-foreground transition-colors text-sm"
      >
        صفحة التسجيل
      </Link>

      <Card className="w-full max-w-md shadow-glow animate-fade-up border-0">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <ClipboardList className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">دخول المُدخل</CardTitle>
          <CardDescription className="text-base">
            سجّل دخولك لإدخال البيانات ومتابعة إحصائياتك
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                اسم المُدخل
              </Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="pr-10 text-right"
                  required
                  maxLength={50}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pr-10 text-right"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "جاري الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/admin"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              دخول المسؤول
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectorLogin;
