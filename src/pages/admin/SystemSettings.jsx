import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FiPlus, FiTrash2, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SystemSettings = () => {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "categories"));
      setCategories(snap.docs.map(d => ({ id: d.id, name: d.data().name })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      const catName = newCat.trim();
      const id = catName.toLowerCase().replace(/\s+/g, '-');
      await setDoc(doc(db, "categories", id), { name: catName });
      setCategories(prev => [...prev, { id, name: catName }]);
      setNewCat('');
      toast.success("Category added!");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  if (loading) return <DashboardLayout><div style={{ padding: '4rem', textAlign: 'center' }}>Loading Settings...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>System Settings</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Categories Manager */}
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.1)', color: 'var(--color-accent)', borderRadius: '12px' }}><FiTag size={24} /></div>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Dynamic Categories</h2>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Manage the categories available for events.</span>
              </div>
            </div>

            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <input 
                type="text" 
                value={newCat} 
                onChange={(e) => setNewCat(e.target.value)} 
                placeholder="New Category Name (e.g. Virtual Reality)"
                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-glass-border)', background: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
              />
              <button type="submit" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                <FiPlus /> Add
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {categories.length === 0 ? <p style={{ color: 'var(--color-text-secondary)' }}>No custom categories yet.</p> : categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-glass-border)', padding: '0.5rem 1rem', borderRadius: '24px' }}>
                  <span style={{ fontWeight: '500' }}>{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                    <FiTrash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SystemSettings;
