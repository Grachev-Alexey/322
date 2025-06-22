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
    
    if (pin.length !== 4) {
      toast({
        title: "Ошибка",
        description: "PIN-код должен содержать 4 цифры",
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--gradient-background)' }}>
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--gradient-premium)' }}>
              <Lock className="text-white text-2xl" size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--graphite)' }}>Вход в систему</h2>
            <p className="text-gray-600 mb-4">Введите 4-значный PIN-код для доступа</p>
            
            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              <div className="font-medium mb-1">Тестовые аккаунты:</div>
              <div>1234 - Администратор</div>
              <div>5678 - Мастер Анна</div>
              <div>9999 - Мастер Олег</div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="pin" className="block text-sm font-medium mb-2" style={{ color: 'var(--graphite)' }}>
                PIN-код
              </Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl font-mono tracking-widest border-2 focus:border-pink-400 focus:ring-pink-400/20 transition-colors duration-200 rounded-xl py-4"
                placeholder="••••"
                disabled={loading}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || pin.length !== 4}
              className="w-full py-4 text-lg font-semibold rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-50"
              style={{ 
                background: loading || pin.length !== 4 ? 'var(--muted)' : 'var(--gradient-premium)',
                color: 'white'
              }}
            >
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
