import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { User, Mail, Phone, MapPin, CreditCard, Shield, Edit2, Save, X, Globe } from 'lucide-react';

const ProfileField = ({ icon: Icon, label, value }) => (
  <div className="flex items-start py-4 border-b border-slate-100 last:border-0">
    <div className="flex-shrink-0 mr-4">
      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <p className="text-base text-slate-900">{value || <span className="text-slate-400 italic">Not provided</span>}</p>
    </div>
  </div>
);

const CustomerProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    email: '',
    address: '',
    passportNumber: '',
    nationality: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/customers/${user.id}`);
        if (res.data.success) {
          setProfile(res.data.customer);
          setEditForm({
            email: res.data.customer.email || '',
            address: res.data.customer.address || '',
            passportNumber: res.data.customer.passportNumber || '',
            nationality: res.data.customer.nationality || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [user.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const res = await api.put(`/customers/${user.id}/profile`, editForm);
      if (res.data.success) {
        setProfile(res.data.customer);
        setIsEditing(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setEditForm({
      email: profile.email || '',
      address: profile.address || '',
      passportNumber: profile.passportNumber || '',
      nationality: profile.nationality || ''
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">View and manage your personal information.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50/30">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-md">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <div className="flex items-center text-slate-500 text-sm mt-1">
              <Shield className="h-4 w-4 mr-1 text-emerald-500" />
              <span>Customer ID: {profile.customerCode}</span>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* Read Only Fields */}
              <div className="opacity-75">
                <label className="block text-sm font-medium text-slate-500 mb-1">Full Name</label>
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed">
                  {profile.name}
                </div>
              </div>
              <div className="opacity-75">
                <label className="block text-sm font-medium text-slate-500 mb-1">Phone Number</label>
                <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed">
                  {profile.phone}
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input 
                  type="text"
                  name="address"
                  value={editForm.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter residential address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                <input 
                  type="text"
                  name="passportNumber"
                  value={editForm.passportNumber}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all uppercase"
                  placeholder="Enter passport number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nationality</label>
                <input 
                  type="text"
                  name="nationality"
                  value={editForm.nationality}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter nationality"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <ProfileField icon={User} label="Full Name" value={profile.name} />
              <ProfileField icon={Phone} label="Phone Number" value={profile.phone} />
              <ProfileField icon={Mail} label="Email Address" value={profile.email} />
              <ProfileField icon={MapPin} label="Address" value={profile.address} />
              <ProfileField icon={CreditCard} label="Passport Number" value={profile.passportNumber} />
              <ProfileField icon={Globe} label="Nationality" value={profile.nationality} />
            </div>
          )}
        </div>

        {isEditing && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
            <button 
              onClick={handleCancel}
              disabled={isSaving}
              className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium shadow-sm shadow-blue-600/20 transition-all flex items-center disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
