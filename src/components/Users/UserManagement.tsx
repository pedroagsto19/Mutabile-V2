import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Shield, User as UserIcon, Search, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Modal } from '../UI/Modal';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/auth';
import { useNotification } from '../../context/NotificationContext';
import { userOperations } from '../../lib/database';

export function UserManagement() {
  const { 
    user: currentUser,
    createAuthUser,
    updateUserMetadata,
    deleteAuthUser,
    hasPermission, 
    canEditUser,
    getAllUsers,
    syncAuthUsers
  } = useAuth();
  const { toast, confirm } = useNotification();
  
  const [users, setUsers] = useState<User[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Load users on mount
  useEffect(() => {
    refreshUsers();
  }, []);

  // Update users when auth context changes
  useEffect(() => {
    setUsers(getAllUsers());
  }, [getAllUsers]);

  const refreshUsers = async () => {
    setIsLoadingUsers(true);
    try {
      await syncAuthUsers();
      setUsers(getAllUsers());
      toast.success('Usuários sincronizados com o Authentication!');
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao sincronizar usuários', 'Verifique a conexão com o Supabase.');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterLevel || user.authLevel === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const handleCreateUser = () => {
    toast.warning('Funcionalidade não disponível', 'A criação de usuários requer implementação de backend seguro. Entre em contato com o administrador do sistema.');
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.warning('Ação não permitida', 'Você não pode excluir sua própria conta');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmed = await confirm(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o usuário "${user.name}"?\n\nEsta ação é PERMANENTE e não pode ser desfeita. O usuário será removido do Authentication e todos os dados relacionados serão afetados.`
    );

    if (!confirmed) return;

    try {
      await userOperations.deleteUser(userId);
      await refreshUsers();
      toast.success('Usuário excluído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário', error.message || 'Verifique suas permissões e tente novamente.');
    }
  };

  const handleUpdatePermissions = async (userId: string, newAuthLevel: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      await userOperations.updateUser(userId, {
        auth_level: newAuthLevel
      });

      await refreshUsers();
      toast.success('Nível de acesso atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar permissões:', error);
      toast.error('Erro ao atualizar permissões', error.message);
    }
  };

  const getAuthLevelColor = (level: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      gestor: 'bg-blue-100 text-blue-800',
      equipe: 'bg-green-100 text-green-800',
      leitor: 'bg-gray-100 text-gray-800',
      inativo: 'bg-orange-100 text-orange-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getAuthLevelLabel = (level: string) => {
    const labels = {
      admin: 'Administrador',
      gestor: 'Gestor',
      equipe: 'Equipe',
      leitor: 'Leitor',
      inativo: 'Inativo'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const UserForm = () => {
    const [formData, setFormData] = useState({
      name: editingUser?.name || '',
      email: editingUser?.email || '',
      role: editingUser?.role || '',
      authLevel: editingUser?.authLevel || 'equipe' as const,
      teamId: editingUser?.teamId || currentUser?.teamId || '',
      managerId: editingUser?.managerId || '',
      password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        if (editingUser) {
          // Atualizar usuário existente diretamente na tabela users
          // A trigger sync_user_to_auth() cuidará de sincronizar com auth.users
          await userOperations.updateUser(editingUser.id, {
            name: formData.name,
            role: formData.role,
            auth_level: formData.authLevel,
            teamId: formData.teamId || null,
            managerId: formData.managerId || null
          });

          toast.success('Usuário atualizado com sucesso!');
        } else {
          // Criar novo usuário
          if (!formData.password) {
            toast.error('Erro de validação', 'Senha é obrigatória para novos usuários');
            return;
          }

          await createAuthUser(formData);
          toast.success('Usuário criado e sincronizado com sucesso!');
        }

        await refreshUsers();
        setShowUserForm(false);
        setEditingUser(null);
      } catch (error: any) {
        console.error('Error saving user:', error);
        toast.error('Erro ao salvar usuário', error.message || 'Tente novamente mais tarde.');
      }
    };

    const canChangeAuthLevel = hasPermission('canChangeUserAuthLevel');
    const isEditingOwnAccount = editingUser?.id === currentUser?.id;

    // Get available managers (users with 'gestor' or 'admin' auth level)
    const availableManagers = users.filter(user => 
      user.authLevel === 'gestor' || user.authLevel === 'admin'
    );

    return (
      <Modal 
        isOpen={showUserForm} 
        onClose={() => {
          setShowUserForm(false);
          setEditingUser(null);
        }} 
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              disabled={!!editingUser} // Email não pode ser alterado após criação
            />
            {editingUser && (
              <p className="text-xs text-gray-500 mt-1">
                O e-mail não pode ser alterado após a criação no Supabase Authentication
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo/Função *
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              placeholder="Ex: Arquiteto, Engenheiro, Gerente de Projetos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Autorização *
            </label>
            <select
              value={formData.authLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, authLevel: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              disabled={!canChangeAuthLevel || isEditingOwnAccount}
            >
              <option value="leitor">Leitor - Apenas visualização</option>
              <option value="equipe">Equipe - Executa atividades</option>
              <option value="gestor">Gestor - Gerencia projetos</option>
              <option value="admin">Administrador - Acesso total</option>
              <option value="inativo">Inativo - Conta desativada</option>
            </select>
            {(!canChangeAuthLevel || isEditingOwnAccount) && (
              <p className="text-xs text-gray-500 mt-1">
                {isEditingOwnAccount 
                  ? 'Você não pode alterar seu próprio nível de autorização'
                  : 'Apenas administradores podem alterar níveis de autorização'
                }
              </p>
            )}
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                placeholder="Digite a senha..."
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de 6 caracteres. O usuário será criado no Supabase Authentication.
              </p>
            </div>
          )}

          {/* Manager Selection for Team Members */}
          {formData.authLevel === 'equipe' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gestor Responsável
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Selecione um gestor (opcional)</option>
                {availableManagers.map(manager => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name} - {manager.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowUserForm(false);
                setEditingUser(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  if (!hasPermission('canManageUsers')) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
        <p className="text-gray-600">
          Você não tem permissão para gerenciar usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserForm />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Gerenciamento de Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            {filteredUsers.length} usuários encontrados • Sincronizado com Authentication
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={refreshUsers}
            disabled={isLoadingUsers}
            title="Sincronizar com Supabase Authentication"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Sistema de Permissões</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Fluxo de cadastro:</strong> Novos usuários criados na aba Authentication do Supabase são automaticamente replicados aqui com permissão de "Leitor".
              Administradores podem então ajustar as permissões conforme necessário usando a coluna "Alterar Nível".
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            >
              <option value="">Todos os níveis</option>
              <option value="admin">Administrador</option>
              <option value="gestor">Gestor</option>
              <option value="equipe">Equipe</option>
              <option value="leitor">Leitor</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível de Acesso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alterar Nível
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              Você
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.managerId && (
                          <div className="text-xs text-gray-400">
                            Gestor: {users.find(u => u.id === user.managerId)?.name || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {user.role}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAuthLevelColor(user.authLevel)}`}>
                      {getAuthLevelLabel(user.authLevel)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {hasPermission('canChangeUserAuthLevel') && user.id !== currentUser?.id ? (
                      <select
                        value={user.authLevel}
                        onChange={(e) => handleUpdatePermissions(user.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-black outline-none"
                      >
                        <option value="leitor">Leitor</option>
                        <option value="equipe">Equipe</option>
                        <option value="gestor">Gestor</option>
                        <option value="admin">Admin</option>
                        <option value="inativo">Inativo</option>
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500">
                        {user.id === currentUser?.id ? 'Você' : 'Sem permissão'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.createdAt.toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {canEditUser(user) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Editar usuário"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('canChangeUserAuthLevel') && user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredUsers.length === 0 && !isLoadingUsers && (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nenhum usuário encontrado.</p>
          <Button onClick={handleCreateUser}>
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro usuário
          </Button>
        </div>
      )}

      {isLoadingUsers && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-500">Sincronizando com Supabase Authentication...</p>
        </div>
      )}
    </div>
  );
}