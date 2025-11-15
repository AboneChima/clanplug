'use client';

import { useState } from 'react';
import { 
  IoPeopleOutline, 
  IoPersonAddOutline, 
  IoShieldCheckmarkOutline, 
  IoSettingsOutline,
  IoTrashOutline,
  IoCreateOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline
} from 'react-icons/io5';

export default function AdminRolesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Mock data - in real app, this would come from API
  const roles = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      userCount: 2,
      permissions: ['all'],
      color: 'red',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Admin',
      description: 'Administrative access with limited permissions',
      userCount: 5,
      permissions: ['users', 'listings', 'transactions', 'reports'],
      color: 'blue',
      createdAt: '2024-01-05'
    },
    {
      id: '3',
      name: 'Moderator',
      description: 'Content moderation and user management',
      userCount: 8,
      permissions: ['listings', 'users', 'reports'],
      color: 'green',
      createdAt: '2024-01-10'
    },
    {
      id: '4',
      name: 'Support Agent',
      description: 'Customer support and basic user assistance',
      userCount: 12,
      permissions: ['users', 'tickets'],
      color: 'purple',
      createdAt: '2024-01-12'
    }
  ];

  const permissions = [
    { id: 'users', name: 'User Management', description: 'Create, edit, and manage user accounts' },
    { id: 'listings', name: 'Listing Management', description: 'Moderate and manage user listings' },
    { id: 'transactions', name: 'Transaction Management', description: 'View and manage financial transactions' },
    { id: 'reports', name: 'Reports & Analytics', description: 'Access system reports and analytics' },
    { id: 'settings', name: 'System Settings', description: 'Configure system-wide settings' },
    { id: 'roles', name: 'Role Management', description: 'Create and manage user roles' },
    { id: 'tickets', name: 'Support Tickets', description: 'Handle customer support requests' },
    { id: 'kyc', name: 'KYC Management', description: 'Verify user identity documents' }
  ];

  const adminUsers = [
    { id: '1', name: 'John Admin', email: 'john@lordmoon.com', role: 'Super Admin', status: 'active' },
    { id: '2', name: 'Jane Moderator', email: 'jane@lordmoon.com', role: 'Moderator', status: 'active' },
    { id: '3', name: 'Mike Support', email: 'mike@lordmoon.com', role: 'Support Agent', status: 'inactive' }
  ];

  const getRoleColor = (color: string) => {
    const colors = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Roles</h1>
          <p className="text-gray-600">Manage administrative roles and permissions</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <IoPersonAddOutline className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role.color)}`}>
                {role.name}
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setSelectedRole(role.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <IoCreateOutline className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-4">{role.description}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Users</span>
                <span className="text-sm font-medium text-gray-900">{role.userCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Permissions</span>
                <span className="text-sm font-medium text-gray-900">{role.permissions.length}</span>
              </div>
              
              <div className="pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permission) => (
                    <span key={permission} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {permission}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Users Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
              <IoPersonAddOutline className="w-4 h-4" />
              Add Admin
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-600 hover:text-blue-800 transition-colors">
                        <IoCreateOutline className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-green-600 hover:text-green-800 transition-colors">
                        <IoCheckmarkCircleOutline className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:text-red-800 transition-colors">
                        <IoCloseCircleOutline className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Reference */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissions.map((permission) => (
            <div key={permission.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <IoShieldCheckmarkOutline className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-gray-900">{permission.name}</h3>
              </div>
              <p className="text-sm text-gray-600">{permission.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}