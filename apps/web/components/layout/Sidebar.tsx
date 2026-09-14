'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Kanban, 
  MessageSquare, 
  PhoneCall, 
  Bot, 
  Settings, 
  LayoutDashboard,
  Zap,
  Users,
  Crown,
  Building2,
  ShoppingCart,
  Package,
  RefreshCw
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>('superadmin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('crdisk_user_role');
      if (role) setUserRole(role);
    }
  }, []);

  const isSuperAdmin = userRole === 'superadmin' || userRole === 'adm';
  const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN' || isSuperAdmin;
  const isOperator = userRole === 'operator' || userRole === 'SALES_REP' || userRole === 'STOCK_OPERATOR';

  const navItems = [
    { label: 'Visão Geral', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Funil de Vendas', href: '/crm', icon: Kanban },
    { label: 'Esteira de Pedidos', href: '/orders', icon: ShoppingCart },
    { label: 'Controle de Estoque', href: '/inventory', icon: Package },
    { label: 'Recorrência & Inatividade', href: '/customers/recurrence', icon: RefreshCw },
    { label: 'Central de Mensagens', href: '/chat', icon: MessageSquare },
    { label: 'Central de Ligações', href: '/dialer', icon: PhoneCall },
    { label: 'Assistente Virtual de Vendas', href: '/ai-agents', icon: Bot },
    ...(isOwnerOrAdmin ? [{ label: 'Gestão de Equipe', href: '/settings/team', icon: Users }] : []),
    ...(!isOperator ? [{ label: 'Configurações', href: '/settings', icon: Settings }] : []),
    ...(isSuperAdmin ? [
      { label: 'Painel Super Admin', href: '/admin', icon: Crown, highlight: true },
      { label: 'Homologação & Saúde', href: '/admin/health', icon: Zap, highlight: true }
    ] : []),
  ];

  return (
    <aside className="w-64 border-r border-[#222924] bg-[#0c0f0d] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2.5">
            Menu Principal
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? item.highlight
                        ? 'bg-purple-950/40 text-purple-200 border border-purple-800/40 font-bold'
                        : 'bg-[#18201C] text-white border border-[#2a362f] shadow-sm font-bold'
                      : item.highlight
                      ? 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/25 border border-transparent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#141815] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive 
                        ? (item.highlight ? 'text-purple-400' : 'text-[#57EF40]') 
                        : (item.highlight ? 'text-purple-400/70' : 'text-muted-foreground group-hover:text-foreground')
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isActive && !item.highlight && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#57EF40]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Proactive Automation Stats Banner */}
        <div className="p-4 rounded-2xl bg-[#111513] border border-[#222924] space-y-2">
          <div className="flex items-center gap-2 text-[#57EF40] text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-[#57EF40]" />
            <span>Acompanhamento Automático</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Mensagens de follow-up enviadas automaticamente após tentativas de contato.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-[#222924] text-[11px] text-muted-foreground">
            <span>Recuperação de Contatos</span>
            <strong className="text-[#57EF40] font-bold">+38.4%</strong>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[#222924] flex items-center justify-between text-[11px] text-muted-foreground font-mono">
        <span>CRDISK Enterprise</span>
        <span className="flex items-center gap-1.5 text-[#57EF40] font-semibold">
          <span className="w-2 h-2 rounded-full bg-[#57EF40]" /> Sistema Operacional
        </span>
      </div>
    </aside>
  );
}
