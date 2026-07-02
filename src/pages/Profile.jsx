import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEdit2, FiUploadCloud, FiLock, FiSave, FiX, FiMapPin, FiCalendar, FiPhone, FiUser } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';

const Profile = () => {
  const { userData, currentUser, updateUserDetails, updateUserPassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userData?.photoURL || null);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const { register: registerPwd, handleSubmit: handlePwdSubmit, formState: { errors: pwdErrors }, watch: watchPwd, reset: resetPwd } = useForm();
  const newPassword = watchPwd("newPassword");

  // Reset form when entering edit mode or when userData changes
  useEffect(() => {
    if (userData) {
      reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        mobileNumber: userData.mobileNumber,
        dob: userData.dob,
        gender: userData.gender,
        bio: userData.bio,
        location: userData.location,
        twitter: userData.socialLinks?.twitter || '',
        linkedin: userData.socialLinks?.linkedin || '',
        github: userData.socialLinks?.github || ''
      });
      setPreviewUrl(userData.photoURL);
    }
  }, [userData, isEditing, reset]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data) => {
    setLoading(true);
    try {
      const updatedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        mobileNumber: data.mobileNumber,
        dob: data.dob,
        gender: data.gender,
        bio: data.bio,
        location: data.location,
        socialLinks: {
          twitter: data.twitter,
          linkedin: data.linkedin,
          github: data.github
        }
      };
      
      await updateUserDetails(updatedData, selectedFile);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile.");
    }
    setLoading(false);
  };

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    try {
      await updateUserPassword(data.newPassword);
      toast.success("Password changed successfully!");
      setIsChangingPassword(false);
      resetPwd();
    } catch (error) {
      toast.error(error.message || "Failed to change password. Note: Requires recent login.");
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', background: 'none', WebkitTextFillColor: 'var(--color-text-primary)' }}>My Profile</h1>
          {!isEditing && !isChangingPassword && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setIsChangingPassword(true)} style={btnStyle('secondary')}>
                <FiLock /> Change Password
              </button>
              <button onClick={() => setIsEditing(true)} style={btnStyle('primary')}>
                <FiEdit2 /> Edit Profile
              </button>
            </div>
          )}
        </div>

        {isChangingPassword ? (
          <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Change Password</h3>
              <button onClick={() => { setIsChangingPassword(false); resetPwd(); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}><FiX size={24} /></button>
            </div>
            <form onSubmit={handlePwdSubmit(onPasswordSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
              <div>
                <input type="password" placeholder="New Password" style={inputStyle} {...registerPwd("newPassword", { required: "Required", minLength: { value: 6, message: "Min 6 chars" }})} />
                {pwdErrors.newPassword && <span style={errorStyle}>{pwdErrors.newPassword.message}</span>}
              </div>
              <div>
                <input type="password" placeholder="Confirm New Password" style={inputStyle} {...registerPwd("confirmNewPassword", { validate: value => value === newPassword || "Passwords do not match" })} />
                {pwdErrors.confirmNewPassword && <span style={errorStyle}>{pwdErrors.confirmNewPassword.message}</span>}
              </div>
              <button type="submit" disabled={loading} style={btnStyle('primary')}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </motion.div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            {/* Left Column: Photo & Quick Info */}
            <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: 'fit-content' }}>
              <div 
                onClick={() => isEditing && fileInputRef.current.click()}
                style={{
                  width: '150px', height: '150px', borderRadius: '50%', marginBottom: '1.5rem',
                  background: previewUrl ? `url(${previewUrl}) center/cover` : 'var(--color-bg-base)',
                  border: '4px solid var(--color-glass-border)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  cursor: isEditing ? 'pointer' : 'default', position: 'relative', overflow: 'hidden'
                }}
              >
                {!previewUrl && <FiUser size={64} color="var(--color-text-secondary)" />}
                {isEditing && (
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', padding: '0.5rem', color: '#fff' }}>
                    <FiUploadCloud size={20} />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{userData?.firstName} {userData?.lastName}</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>@{userData?.username}</p>
              
              <div style={{ width: '100%', height: '1px', background: 'var(--color-glass-border)', margin: '1rem 0' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}><FiMapPin /> {userData?.location || 'No location set'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}><FiPhone /> {userData?.mobileNumber || 'No mobile set'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-text-secondary)' }}><FiCalendar /> Joined {userData?.createdAt?.toDate().toLocaleDateString() || 'Recently'}</div>
              </div>
            </div>

            {/* Right Column: Details & Edit Form */}
            <div className="card" style={{ padding: '2rem' }}>
              {isEditing ? (
                <form onSubmit={handleSubmit(onProfileSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label>First Name</label><input type="text" style={inputStyle} {...register("firstName", { required: "Required" })} /></div>
                    <div><label>Last Name</label><input type="text" style={inputStyle} {...register("lastName", { required: "Required" })} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label>Username</label><input type="text" style={inputStyle} {...register("username", { required: "Required" })} /></div>
                    <div><label>Mobile Number</label><input type="tel" style={inputStyle} {...register("mobileNumber")} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div><label>Date of Birth</label><input type="date" style={inputStyle} {...register("dob")} /></div>
                    <div><label>Gender</label>
                      <select style={{...inputStyle, appearance: 'none'}} {...register("gender")}>
                        <option value="male" style={{color: 'black'}}>Male</option>
                        <option value="female" style={{color: 'black'}}>Female</option>
                        <option value="other" style={{color: 'black'}}>Other</option>
                        <option value="prefer_not_to_say" style={{color: 'black'}}>Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div><label>Location</label><input type="text" style={inputStyle} {...register("location")} placeholder="City, Country" /></div>
                  <div><label>Bio</label><textarea style={{...inputStyle, minHeight: '100px'}} {...register("bio")} placeholder="Tell us about yourself..." /></div>
                  
                  <h4 style={{ marginTop: '1rem' }}>Social Links</h4>
                  <div><input type="url" style={inputStyle} {...register("twitter")} placeholder="Twitter URL" /></div>
                  <div><input type="url" style={inputStyle} {...register("linkedin")} placeholder="LinkedIn URL" /></div>
                  <div><input type="url" style={inputStyle} {...register("github")} placeholder="GitHub URL" /></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => setIsEditing(false)} style={btnStyle('secondary')}>Cancel</button>
                    <button type="submit" disabled={loading} style={btnStyle('primary')}><FiSave /> {loading ? "Saving..." : "Save Changes"}</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>About Me</h3>
                    <p style={{ lineHeight: '1.6' }}>{userData?.bio || "This user hasn't written a bio yet."}</p>
                  </div>
                  
                  <div>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Account Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div><span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.875rem' }}>Email</span>{currentUser?.email}</div>
                      <div><span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.875rem' }}>Date of Birth</span>{userData?.dob || 'Not set'}</div>
                      <div><span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.875rem' }}>Gender</span>{userData?.gender || 'Not set'}</div>
                      <div><span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.875rem' }}>Account Status</span>{currentUser?.emailVerified ? <span style={{color: 'var(--color-success)'}}>Verified</span> : <span style={{color: 'var(--color-danger)'}}>Unverified</span>}</div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Social Links</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {userData?.socialLinks?.twitter ? <a href={userData.socialLinks.twitter} target="_blank" rel="noreferrer" style={{color: 'var(--color-accent)'}}>Twitter</a> : <span style={{color: 'var(--color-text-secondary)'}}>Twitter: Not set</span>}
                      {userData?.socialLinks?.linkedin ? <a href={userData.socialLinks.linkedin} target="_blank" rel="noreferrer" style={{color: 'var(--color-accent)'}}>LinkedIn</a> : <span style={{color: 'var(--color-text-secondary)'}}>LinkedIn: Not set</span>}
                      {userData?.socialLinks?.github ? <a href={userData.socialLinks.github} target="_blank" rel="noreferrer" style={{color: 'var(--color-accent)'}}>GitHub</a> : <span style={{color: 'var(--color-text-secondary)'}}>GitHub: Not set</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
  display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s',
  ...(type === 'primary' ? { background: 'var(--color-accent)', color: '#fff' } : { background: 'rgba(255,255,255,0.1)', color: 'var(--color-text-primary)' })
});

const errorStyle = { color: 'var(--color-danger)', fontSize: '0.875rem' };

export default Profile;
