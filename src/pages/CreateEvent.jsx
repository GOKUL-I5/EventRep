import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useEvent } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUploadCloud, FiCalendar, FiMapPin, FiDollarSign, FiUsers, FiTag, FiLock, FiCheckCircle } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';

const CreateEvent = () => {
  const { createEvent } = useEvent();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([{ type: 'General', price: 0 }]);
  
  const isApproved = userData?.isApprovedCreator === true || userData?.role === 'super_admin';

  const { register, handleSubmit, formState: { errors } } = useForm();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      return toast.error("Maximum 5 gallery images allowed");
    }
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length < files.length) {
      toast.warning("Some files were skipped (exceeded 5MB limit)");
    }
    setGalleryFiles(validFiles);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Pass the selected image file and gallery files
      const fullData = { ...data, ticketTypes };
      const { id: eventId, fallbackUsed } = await createEvent(fullData, selectedFile, galleryFiles);
      if (fallbackUsed) {
        toast.warning("Event submitted successfully with a placeholder image. Note: Firebase Storage upload failed (verify CORS settings).");
      } else {
        toast.success("Event created successfully!");
      }
      navigate(`/events/manage`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create event");
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '800px', margin: '0 auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Create New Event</h1>
          {isApproved && (
            <span style={{ 
              background: 'rgba(16,185,129,0.1)', 
              color: '#10b981', 
              border: '1px solid rgba(16,185,129,0.2)',
              padding: '0.35rem 0.85rem', 
              borderRadius: '20px', 
              fontSize: '0.75rem', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}>
              <FiCheckCircle style={{ fontSize: '0.85rem' }} /> Verified Creator
            </span>
          )}
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!isApproved && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '12px',
              padding: '1.25rem',
              color: '#fca5a5',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiLock /> Event Creation Restricted
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>
                Your account is waiting for Super Admin approval before you can create events.
              </p>
            </div>
          )}
          
          {/* Cover Image Upload */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '500' }}>Event Cover Image</label>
              <label style={{
                width: '100%', height: '200px', borderRadius: '16px',
                background: previewUrl ? `url(${previewUrl}) center/cover` : 'rgba(255,255,255,0.02)',
                border: '2px dashed var(--color-glass-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', transition: 'border-color 0.2s', color: 'var(--color-text-secondary)'
              }}>
                {!previewUrl && (
                  <>
                    <FiUploadCloud size={48} style={{ marginBottom: '1rem' }} />
                    <span>Click to upload image (Max 5MB)</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Gallery Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: '500' }}>Event Gallery Images (Max 5)</label>
              <label style={{
                width: '100%', height: '200px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.02)',
                border: '2px dashed var(--color-glass-border)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', transition: 'border-color 0.2s', color: 'var(--color-text-secondary)'
              }}>
                <FiUploadCloud size={48} style={{ marginBottom: '1rem' }} />
                <span>Upload multiple files</span>
                <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {galleryFiles.length > 0 ? `${galleryFiles.length} files selected` : ''}
                </span>
                <input type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div>
              <label>Event Title</label>
              <input type="text" style={inputStyle} placeholder="e.g. Tech Founders Summit" {...register("title", { required: "Title is required" })} />
              {errors.title && <span style={errorStyle}>{errors.title.message}</span>}
            </div>
            
            <div>
              <label>Description</label>
              <textarea style={{...inputStyle, minHeight: '120px'}} placeholder="What is this event about?" {...register("description", { required: "Description is required" })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label><FiCalendar /> Date</label>
              <input type="date" style={inputStyle} {...register("date", { required: "Date is required" })} />
            </div>
            <div>
              <label><FiCalendar /> Time</label>
              <input type="time" style={inputStyle} {...register("time", { required: "Time is required" })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label><FiMapPin /> Location / Virtual Link</label>
              <input type="text" style={inputStyle} placeholder="Address or Zoom link" {...register("location", { required: "Location is required" })} />
            </div>
            <div>
              <label><FiTag /> Category</label>
              <select style={inputStyle} {...register("category", { required: "Category is required" })}>
                <option value="" disabled style={{color: 'black'}}>Select a category</option>
                <option value="music" style={{color: 'black'}}>Music</option>
                <option value="corporate" style={{color: 'black'}}>Corporate</option>
                <option value="college_fest" style={{color: 'black'}}>College Fest</option>
                <option value="hackathon" style={{color: 'black'}}>Hackathon</option>
                <option value="sports" style={{color: 'black'}}>Sports</option>
                <option value="wedding" style={{color: 'black'}}>Wedding</option>
                <option value="birthday" style={{color: 'black'}}>Birthday</option>
                <option value="startup" style={{color: 'black'}}>Startup</option>
                <option value="workshop" style={{color: 'black'}}>Workshop</option>
                <option value="seminar" style={{color: 'black'}}>Seminar</option>
                <option value="technology" style={{color: 'black'}}>Technology</option>
                <option value="food_festival" style={{color: 'black'}}>Food Festival</option>
                <option value="gaming" style={{color: 'black'}}>Gaming</option>
                <option value="ngo" style={{color: 'black'}}>NGO / Social</option>
                <option value="fashion" style={{color: 'black'}}>Fashion</option>
                <option value="community" style={{color: 'black'}}>Community</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ fontWeight: '600' }}>Ticket Types & Pricing</label>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
              <div>
                <label>Base Ticket Price (USD)</label>
                <input type="number" min="0" step="0.01" style={inputStyle} placeholder="0 for Free" {...register("price")} onChange={(e) => {
                  const val = e.target.value;
                  const newTypes = [...ticketTypes];
                  newTypes[0].price = Number(val);
                  setTicketTypes(newTypes);
                }} />
              </div>
              <div>
                <label><FiUsers /> Total Capacity</label>
                <input type="number" min="1" style={inputStyle} placeholder="E.g. 500" {...register("capacity", { required: "Capacity is required" })} />
              </div>
            </div>

            <div>
              <label>Add VIP / Special Ticket (Optional)</label>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <input type="text" style={inputStyle} placeholder="Type (e.g. VIP)" value={ticketTypes[1]?.type || ''} onChange={(e) => {
                  const newTypes = [...ticketTypes];
                  if (!newTypes[1]) newTypes[1] = { type: '', price: 0 };
                  newTypes[1].type = e.target.value;
                  setTicketTypes(newTypes);
                }} />
                <input type="number" min="0" step="0.01" style={inputStyle} placeholder="Price (USD)" value={ticketTypes[1]?.price || ''} onChange={(e) => {
                  const newTypes = [...ticketTypes];
                  if (!newTypes[1]) newTypes[1] = { type: '', price: 0 };
                  newTypes[1].price = Number(e.target.value);
                  setTicketTypes(newTypes);
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={() => handleSubmit((data) => onSubmit({ ...data, status: 'draft' }))()}
              style={{ ...btnStyle('secondary'), opacity: (loading || !isApproved) ? 0.5 : 1, cursor: !isApproved ? 'not-allowed' : 'pointer' }}
              disabled={loading || !isApproved}
            >
              Save as Draft
            </button>
            <button 
              type="submit" 
              onClick={() => handleSubmit((data) => onSubmit({ ...data, status: 'approved' }))()}
              style={{ ...btnStyle('primary'), opacity: (loading || !isApproved) ? 0.5 : 1, cursor: !isApproved ? 'not-allowed' : 'pointer' }}
              disabled={loading || !isApproved}
            >
              {loading ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>

        </form>
      </motion.div>
    </DashboardLayout>
  );
};

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--color-glass-border)',
  color: 'var(--color-text-primary)', outline: 'none', fontSize: '1rem', marginTop: '0.25rem'
};

const btnStyle = (type) => ({
  padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', border: 'none',
  transition: 'all 0.2s',
  ...(type === 'primary' ? { background: 'var(--color-accent)', color: '#fff' } : { background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-primary)' })
});

const errorStyle = { color: 'var(--color-danger)', fontSize: '0.875rem' };

export default CreateEvent;
