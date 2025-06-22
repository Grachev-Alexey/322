import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface User {
  id: number;
  name: string;
  role: 'master' | 'admin';
}

interface AuthPageProps {
  onLogin: (user: User) => void;
}

export default function AuthPage({ onLogin }: AuthPageProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      toast({
        title: "Ошибка",
        description: "PIN-код должен содержать 6 цифр",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ pin })
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data.user);
        toast({
          title: "Успешно",
          description: `Добро пожаловать, ${data.user.name}!`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Ошибка входа",
          description: error.message || "Неверный PIN-код",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Ошибка подключения к серверу",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Lock className="text-white text-2xl" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Вход в систему</h2>
            <p className="text-gray-600">Введите PIN-код для доступа к калькулятору</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                PIN-код
              </Label>
              <Input
                id="pin"
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl font-mono tracking-widest"
                placeholder="••••••"
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || pin.length !== 6}
              className="w-full btn-primary"
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
