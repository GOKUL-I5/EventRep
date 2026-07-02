import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiEdit2, FiTrash2, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser.uid) {
      toast.error("You cannot change your own role!");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.uid) {
      toast.error("You cannot delete yourself!");
      return;
    }
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success("User deleted");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  if (loading) return <DashboardLayout><div style={{ padding: '4rem', textAlign: 'center' }}>Loading Users...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Manage Users</h1>
        
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-glass-border)' }}>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>User</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-glass-border)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.photoURL ? `url(${user.photoURL}) center/cover` : 'var(--color-glass-border)' }} />
                      <div>
                        <span style={{ display: 'block', fontWeight: '500' }}>{user.firstName} {user.lastName}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ background: user.role === 'admin' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)', color: user.role === 'admin' ? 'var(--color-accent)' : 'var(--color-text-secondary)', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: '600' }}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <select 
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{ padding: '0.5rem', background: 'var(--color-bg-base)', border: '1px solid var(--color-glass-border)', color: 'var(--color-text-primary)', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button onClick={() => handleDeleteUser(user.id)} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
