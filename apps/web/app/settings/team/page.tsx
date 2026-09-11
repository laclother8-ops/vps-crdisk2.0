'use client';

import React from 'react';
import { TeamManagement } from '../../../components/settings/TeamManagement';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TeamSettingsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link 
          href="/settings" 
          className="p-2 rounded-xl bg-[#111513] border border-[#26332B] text-gray-400 hover:text-white hover:border-[#57EF40]/40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#57EF40]" />
            Gerenciamento de Equipe & Usuários
          </h1>
          <p className="text-sm text-gray-400">
            Controle de operadores, administradores e permissões de acesso do Workspace.
          </p>
        </div>
      </div>

      <TeamManagement />
    </div>
  );
}
