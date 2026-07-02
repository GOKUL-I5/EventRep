import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FcGoogle } from 'react-icons/fc';
import { FiUploadCloud } from 'react-icons/fi';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const { login, signupWithDetails, loginWithGoogle, resetPassword, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const password = watch("password");

  const toggleMode = (mode) => {
    setIsLogin(mode);
    reset();
    setSelectedFile(null);
    setPreviewUrl(null);
  };

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

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(data.email, data.password, data.rememberMe);
        toast.success("Logged in successfully!");
        navigate('/dashboard');
      } else {
        await signupWithDetails(data, selectedFile);
        await verifyEmail();
        toast.success("Account created! Please check your email to verify.");
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || "Failed to authenticate.");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      toast.success("Logged in with Google!");
      navigate('/dashboard');
    } catch (error) {
      toast.error("Google sign-in failed.");
    }
  };

  const handleForgotPassword = async () => {
    const email = watch("email");
    if (!email) {
      return toast.warning("Please enter your email first to reset password.");
    }
    try {
      await resetPassword(email);
      toast.success("Password reset email sent!");
    } catch (error) {
      toast.error("Failed to reset password.");
    }
  };

  return (
    <div className="center-container" style={{ padding: '2rem 1rem' }}>
      <div className="aurora-bg" style={{ opacity: 0.5 }}>
        <div className="aurora-blob blob-1" style={{ animationDelay: '-10s' }}></div>
      </div>

      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5 }}
        style={{ 
          padding: '2.5rem', 
          width: '100%', 
          maxWidth: isLogin ? '420px' : '600px', 
          zIndex: 10,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', marginBottom: '2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '4px' }}>
          <button 
            type="button"
            onClick={() => toggleMode(true)}
            style={{ 
              flex: 1, padding: '0.75rem', borderRadius: '8px', 
              background: isLogin ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: isLogin ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: '500', transition: 'all 0.3s ease'
            }}
          >
            Login
          </button>
          <button 
            type="button"
            onClick={() => toggleMode(false)}
            style={{ 
              flex: 1, padding: '0.75rem', borderRadius: '8px', 
              background: !isLogin ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: !isLogin ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: '500', transition: 'all 0.3s ease'
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Profile Photo Upload */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      width: '100px', height: '100px', borderRadius: '50%',
                      background: previewUrl ? `url(${previewUrl}) center/cover` : 'rgba(255,255,255,0.05)',
                      border: '2px dashed var(--color-glass-border)',
                      display: 'flex', justifyContent: 'center', alignItems: 'center',
                      cursor: 'pointer', overflow: 'hidden', position: 'relative'
                    }}
                  >
                    {!previewUrl && <FiUploadCloud size={32} color="var(--color-text-secondary)" />}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Upload Profile Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <input type="text" placeholder="First Name" style={inputStyle} {...register("firstName", { required: "First name required" })} />
                    {errors.firstName && <span style={errorStyle}>{errors.firstName.message}</span>}
                  </div>
                  <div>
                    <input type="text" placeholder="Last Name" style={inputStyle} {...register("lastName", { required: "Last name required" })} />
                    {errors.lastName && <span style={errorStyle}>{errors.lastName.message}</span>}
                  </div>
                </div>

                <div>
                  <input type="text" placeholder="Username" style={inputStyle} {...register("username", { required: "Username required" })} />
                  {errors.username && <span style={errorStyle}>{errors.username.message}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <input type="tel" placeholder="Mobile Number" style={inputStyle} {...register("mobileNumber", { required: "Mobile required" })} />
                    {errors.mobileNumber && <span style={errorStyle}>{errors.mobileNumber.message}</span>}
                  </div>
                  <div>
                    <input type="date" style={inputStyle} {...register("dob", { required: "Date of Birth required" })} />
                    {errors.dob && <span style={errorStyle}>{errors.dob.message}</span>}
                  </div>
                </div>

                <div>
                  <select style={{...inputStyle, appearance: 'none'}} {...register("gender", { required: "Gender required" })}>
                    <option value="" disabled selected hidden>Select Gender</option>
                    <option value="male" style={{color: 'black'}}>Male</option>
                    <option value="female" style={{color: 'black'}}>Female</option>
                    <option value="other" style={{color: 'black'}}>Other</option>
                    <option value="prefer_not_to_say" style={{color: 'black'}}>Prefer not to say</option>
                  </select>
                  {errors.gender && <span style={errorStyle}>{errors.gender.message}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <input 
              type="email" 
              placeholder="Email Address" 
              {...register("email", { required: "Email is required" })}
              style={inputStyle}
            />
            {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
          </div>

          <div style={{ display: isLogin ? 'block' : 'grid', gridTemplateColumns: isLogin ? '1fr' : '1fr 1fr', gap: '1rem' }}>
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                {...register("password", { 
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 chars" }
                })}
                style={inputStyle}
              />
              {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
            </div>

            {!isLogin && (
              <div>
                <input 
                  type="password" 
                  placeholder="Confirm Password" 
                  {...register("confirmPassword", { 
                    validate: value => value === password || "Passwords do not match"
                  })}
                  style={inputStyle}
                />
                {errors.confirmPassword && <span style={errorStyle}>{errors.confirmPassword.message}</span>}
              </div>
            )}
          </div>

          {isLogin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" {...register("rememberMe")} />
                Remember me
              </label>
              <span onClick={handleForgotPassword} style={{ color: 'var(--color-accent)', cursor: 'pointer' }}>
                Forgot Password?
              </span>
            </div>
          )}

          {!isLogin && (
             <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                 <input type="checkbox" {...register("terms", { required: "You must accept the terms" })} />
                 <span>I agree to the <span style={{color: 'var(--color-accent)'}}>Terms & Conditions</span></span>
               </label>
               {errors.terms && <span style={errorStyle}>{errors.terms.message}</span>}
             </div>
          )}

          <motion.button 
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{
              padding: '1rem',
              borderRadius: '12px',
              background: 'var(--color-text-primary)',
              color: 'var(--color-bg-base)',
              fontWeight: '600',
              fontSize: '1rem',
              marginTop: '1rem',
              opacity: loading ? 0.7 : 1,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
          </motion.button>
        </form>

        <div style={{ margin: '1.5rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ height: '1px', flex: 1, background: 'var(--color-glass-border)' }}></div>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>or continue with</span>
          <div style={{ height: '1px', flex: 1, background: 'var(--color-glass-border)' }}></div>
        </div>

        <motion.button 
          onClick={handleGoogleSignIn}
          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            background: 'transparent',
            border: '1px solid var(--color-glass-border)',
            color: 'var(--color-text-primary)',
            fontWeight: '500',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <FcGoogle size={24} />
          Google
        </motion.button>
      </motion.div>
      
      {/* Custom Scrollbar styling for this component */}
      <style>{`
        .glass-panel::-webkit-scrollbar {
          width: 8px;
        }
        .glass-panel::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .glass-panel::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .glass-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '1rem',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--color-glass-border)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  fontSize: '1rem'
};

const errorStyle = {
  color: 'var(--color-danger)',
  fontSize: '0.875rem',
  marginTop: '0.25rem',
  display: 'block'
};

export default Auth;
