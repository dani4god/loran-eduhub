// app/(public)/auth/tutor/register/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Lock, 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  Plus,
  Trash2,
  FileText,
  Video,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Header from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Validation schemas
const qualificationSchema = z.object({
  degree: z.string().min(1, 'Degree is required'),
  institution: z.string().min(1, 'Institution is required'),
  year: z.string().min(4, 'Valid year is required'),
});

const pricingSchema = z.object({
  monthly: z.number().positive('Enter a price greater than 0'),
  threeMonths: z.number().positive('Enter a price greater than 0'),
  sixMonths: z.number().positive('Enter a price greater than 0'),
  oneYear: z.number().positive('Enter a price greater than 0'),
});

const phase1Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio must be less than 500 characters'),
  qualifications: z.array(qualificationSchema).min(1, 'At least one qualification is required'),
  courses: z.array(z.string()).min(1, 'Select at least one course'),
  profileImage: z.string().optional(),
  resume: z.string().optional(),
  videoLink: z.string().url('Please enter a valid URL').optional(),
  pricing: pricingSchema,
});

const phase2Schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must agree to the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type Phase1Data = z.infer<typeof phase1Schema>;
type Phase2Data = z.infer<typeof phase2Schema>;

// Helper to convert string to number for form inputs
const parseNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function TutorRegistration() {
  const router = useRouter();
  const [phase, setPhase] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  const {
    register: registerPhase1,
    handleSubmit: handlePhase1Submit,
    formState: { errors: phase1Errors },
    setValue: setPhase1Value,
    watch: watchPhase1,
  } = useForm<Phase1Data>({
    resolver: zodResolver(phase1Schema) as any, // Type assertion to fix the issue
    defaultValues: {
      qualifications: [{ degree: '', institution: '', year: '' }],
      courses: [],
      pricing: {
        monthly: 0,
        threeMonths: 0,
        sixMonths: 0,
        oneYear: 0,
      },
    },
  });
  
  const {
    register: registerPhase2,
    handleSubmit: handlePhase2Submit,
    formState: { errors: phase2Errors },
    watch: watchPhase2,
  } = useForm<Phase2Data>({
    resolver: zodResolver(phase2Schema),
    defaultValues: {
      terms: false,
    },
  });
  
  const qualifications = watchPhase1('qualifications');
  const selectedCourses = watchPhase1('courses');
  const videoLink = watchPhase1('videoLink');
  
  // Load courses on mount
  useEffect(() => {
    fetchCourses();
  }, []);
  
  const fetchCourses = async () => {
    try {
      setCoursesLoading(true);
      const res = await fetch('/api/courses');
      const data = await res.json();
      setCourses(data.courses || []);
      setFilteredCourses(data.courses || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      toast.error('Failed to load courses');
      setCategories([]);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  };
  
  // Filter courses
  useEffect(() => {
    let filtered = courses;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCourses(filtered);
  }, [selectedCategory, searchTerm, courses]);
  
  // Upload file to Cloudinary (only for images and PDFs)
  const uploadFile = async (file: File, type: 'image' | 'pdf') => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.url;
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
      return null;
    } finally {
      setUploading(false);
    }
  };
  
  // Handle file uploads (only for profile image and resume)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'profileImage' | 'resume') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    let type: 'image' | 'pdf' = 'image';
    if (field === 'resume') type = 'pdf';
    
    const url = await uploadFile(file, type);
    if (url) {
      setPhase1Value(field, url);
      toast.success(`${field === 'profileImage' ? 'Profile image' : 'Resume'} uploaded successfully`);
    }
  };
  
  // Add qualification
  const addQualification = () => {
    const current = qualifications || [];
    setPhase1Value('qualifications', [...current, { degree: '', institution: '', year: '' }]);
  };
  
  // Remove qualification
  const removeQualification = (index: number) => {
    const current = qualifications || [];
    const updated = current.filter((_, i) => i !== index);
    setPhase1Value('qualifications', updated);
  };
  
  // Toggle course selection
  const toggleCourse = (courseId: string) => {
    const current = selectedCourses || [];
    if (current.includes(courseId)) {
      setPhase1Value('courses', current.filter(id => id !== courseId));
    } else {
      setPhase1Value('courses', [...current, courseId]);
    }
  };
  
  // Validate video URL
  const isValidVideoUrl = (url: string) => {
    const patterns = [
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
      /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/,
      /^(https?:\/\/)?(www\.)?loom\.com\/share\/.+$/,
      /^(https?:\/\/)?(drive\.google\.com)\/file\/d\/.+$/,
    ];
    return patterns.some(pattern => pattern.test(url));
  };
  
  // Handle phase 1 submission
  const onPhase1Submit = async (data: Phase1Data) => {
    // Validate file uploads
    if (!data.profileImage) {
      toast.error('Please upload a profile image');
      return;
    }
    if (!data.resume) {
      toast.error('Please upload your resume');
      return;
    }
    if (!data.videoLink) {
      toast.error('Please provide a video introduction link');
      return;
    }
    
    // Validate video URL format
    if (!isValidVideoUrl(data.videoLink)) {
      toast.error('Please enter a valid video URL (YouTube, Vimeo, Loom, or Google Drive)');
      return;
    }
    
    // Store in session storage for phase 2
    sessionStorage.setItem('tutorRegistrationData', JSON.stringify(data));
    setPhase(2);
    window.scrollTo(0, 0);
  };
  
  // Handle phase 2 submission (final)
  const onPhase2Submit = async (data: Phase2Data) => {
    setLoading(true);
    
    const phase1Data = JSON.parse(sessionStorage.getItem('tutorRegistrationData') || '{}');
    const completeData = { ...phase1Data, ...data };
    
    try {
      const res = await fetch('/api/auth/register/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        toast.success('Application submitted successfully!');
        sessionStorage.removeItem('tutorRegistrationData');
        router.push('/auth/tutor/register/success');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-12">
          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    phase >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                  }`}>
                    1
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${
                    phase >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    phase >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'
                  }`}>
                    2
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-medium">Professional Details</span>
                  <span className="text-sm font-medium">Account Setup</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Container */}
          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {phase === 1 && (
                <motion.div
                  key="phase1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  <form onSubmit={handlePhase1Submit(onPhase1Submit)}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Information</h2>
                    
                    {/* Personal Details */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            {...registerPhase1('firstName')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="John"
                          />
                          {phase1Errors.firstName && (
                            <p className="mt-1 text-sm text-red-600">{phase1Errors.firstName.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            {...registerPhase1('lastName')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Doe"
                          />
                          {phase1Errors.lastName && (
                            <p className="mt-1 text-sm text-red-600">{phase1Errors.lastName.message}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            {...registerPhase1('email')}
                            type="email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="john@example.com"
                          />
                          {phase1Errors.email && (
                            <p className="mt-1 text-sm text-red-600">{phase1Errors.email.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            {...registerPhase1('phone')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+234 123 456 7890"
                          />
                          {phase1Errors.phone && (
                            <p className="mt-1 text-sm text-red-600">{phase1Errors.phone.message}</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Bio */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Professional Bio *
                        </label>
                        <textarea
                          {...registerPhase1('bio')}
                          rows={5}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Tell us about your teaching experience, expertise, and approach to education..."
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          {watchPhase1('bio')?.length || 0}/500 characters
                        </p>
                        {phase1Errors.bio && (
                          <p className="mt-1 text-sm text-red-600">{phase1Errors.bio.message}</p>
                        )}
                      </div>
                      
                      {/* Qualifications */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Qualifications *
                        </label>
                        <div className="space-y-4">
                          {qualifications?.map((_, index) => (
                            <div key={index} className="p-4 border border-gray-200 rounded-lg relative">
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeQualification(index)}
                                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                  {...registerPhase1(`qualifications.${index}.degree`)}
                                  placeholder="Degree/Certificate"
                                  className="px-3 py-2 border border-gray-300 rounded"
                                />
                                <input
                                  {...registerPhase1(`qualifications.${index}.institution`)}
                                  placeholder="Institution"
                                  className="px-3 py-2 border border-gray-300 rounded"
                                />
                                <input
                                  {...registerPhase1(`qualifications.${index}.year`)}
                                  placeholder="Year"
                                  className="px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={addQualification}
                          className="mt-3 text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Another Qualification
                        </button>
                        {phase1Errors.qualifications && (
                          <p className="mt-1 text-sm text-red-600">{phase1Errors.qualifications.message}</p>
                        )}
                      </div>
                      
                      {/* File Uploads - Only Image and Resume */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Profile Image */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Photo *
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition">
                            <div className="space-y-1 text-center">
                              {watchPhase1('profileImage') ? (
                                <div className="relative inline-block">
                                  <Image
                                    src={watchPhase1('profileImage')!}
                                    alt="Profile"
                                    width={100}
                                    height={100}
                                    className="rounded-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setPhase1Value('profileImage', '')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                      <span>Upload a file</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, 'profileImage')}
                                        className="sr-only"
                                      />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Resume */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resume/CV *
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition">
                            <div className="space-y-1 text-center">
                              {watchPhase1('resume') ? (
                                <div className="text-center">
                                  <FileText className="mx-auto h-12 w-12 text-green-500" />
                                  <button
                                    type="button"
                                    onClick={() => setPhase1Value('resume', '')}
                                    className="mt-2 text-red-500 text-sm hover:text-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                  <div className="flex text-sm text-gray-600">
                                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                                      <span>Upload PDF</span>
                                      <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => handleFileUpload(e, 'resume')}
                                        className="sr-only"
                                      />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                  </div>
                                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Video Introduction Link */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video Introduction *
                        </label>
                        
                        {/* Video Guidelines Card */}
                        <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <Video className="w-5 h-5 text-blue-600 mt-0.5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-sm mb-2">
                                Video Guidelines (8 minutes max)
                              </h4>
                              <ul className="space-y-1.5 text-xs text-gray-700">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Introduce yourself and your teaching background</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Explain your qualifications and expertise areas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Demonstrate your teaching style or approach</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Share why students should learn from you</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  <span>Keep the video professional and well-lit</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        
                        {/* Video URL Input */}
                        <div className="mt-1">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <Video className="w-5 h-5 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              {...registerPhase1('videoLink')}
                              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          {phase1Errors.videoLink && (
                            <p className="mt-1 text-sm text-red-600">{phase1Errors.videoLink.message}</p>
                          )}
                        </div>
                        
                        {/* Supported Platforms */}
                        <div className="mt-3 flex flex-wrap gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span>YouTube</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M22.396 7.164c-.23-1.38-1.102-2.5-2.346-3.03C17.582 3.29 12 3.29 12 3.29s-5.582 0-8.05.845c-1.244.53-2.116 1.65-2.346 3.03C.904 9.27.788 12.5.788 12.5s.116 3.23.816 5.336c.23 1.38 1.102 2.5 2.346 3.03 2.468.845 8.05.845 8.05.845s5.582 0 8.05-.845c1.244-.53 2.116-1.65 2.346-3.03.7-2.106.816-5.336.816-5.336s-.116-3.23-.816-5.336zM9.54 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span>Vimeo</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 13c-1.67 0-3.14-.85-4-2.15.02-1.32 2.67-2.05 4-2.05s3.98.73 4 2.05c-.86 1.3-2.33 2.15-4 2.15z"/>
                            </svg>
                            <span>Loom</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.6 2.2c-.3-.4-.8-.6-1.2-.6H5.6c-.5 0-1 .2-1.3.6C3.9 2.7 3.7 3.2 3.7 3.8v16.4c0 .5.2 1 .6 1.3.3.3.8.5 1.3.5h12.8c.5 0 1-.2 1.3-.6.4-.3.6-.8.6-1.3V3.8c0-.6-.2-1.1-.7-1.6zM15 2.8v3.9c0 .3-.2.5-.5.5h-5c-.3 0-.5-.2-.5-.5V2.8h6zm3.5 17.5c0 .1-.1.2-.2.2H5.7c-.1 0-.2-.1-.2-.2V7.3h12.9v12.9h.1z"/>
                            </svg>
                            <span>Google Drive</span>
                          </div>
                        </div>
                        
                        {/* Live Preview when URL is entered */}
                        {videoLink && isValidVideoUrl(videoLink) && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ExternalLink className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700">Video link verified!</span>
                              </div>
                              <a
                                href={videoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                Preview <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}
                        
                        <p className="mt-2 text-xs text-gray-500">
                          Example: https://youtube.com/watch?v=your-video-id or https://vimeo.com/your-video-id
                        </p>
                      </div>
                      
                      {/* Course Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Courses You Can Teach *
                        </label>
                        
                        {/* Filters */}
                        <div className="mb-4 flex gap-4">
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">All Categories</option>
                            {categories && categories.length > 0 ? (
                              categories.map(cat => (
                                <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                              ))
                            ) : (
                              <option disabled>No categories available</option>
                            )}
                          </select>
                          
                          <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* Course Grid with Loading State */}
                        {coursesLoading ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-8 text-center border border-gray-200 rounded-lg">
                            <div className="col-span-2 text-gray-500">Loading courses...</div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                            {filteredCourses.length > 0 ? (
                              filteredCourses.map((course) => (
                                <label
                                  key={course._id}
                                  className={`flex items-start p-3 rounded-lg cursor-pointer transition ${
                                    selectedCourses?.includes(course._id)
                                      ? 'bg-blue-50 border-2 border-blue-500'
                                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCourses?.includes(course._id)}
                                    onChange={() => toggleCourse(course._id)}
                                    className="mt-1 mr-3"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{course.name}</p>
                                    <p className="text-sm text-gray-500">{course.description?.substring(0, 100)}</p>
                                    <span className="inline-block mt-1 text-xs px-2 py-1 bg-gray-200 rounded">
                                      {course.category}
                                    </span>
                                  </div>
                                </label>
                              ))
                            ) : (
                              <div className="col-span-2 text-center py-8 text-gray-500">
                                No courses found. Please try a different search.
                              </div>
                            )}
                          </div>
                        )}
                        
                        {phase1Errors.courses && (
                          <p className="mt-1 text-sm text-red-600">{phase1Errors.courses.message}</p>
                        )}
                        
                        <p className="text-sm text-gray-500 mt-2">
                          Selected: {selectedCourses?.length || 0} courses
                        </p>
                      </div>

                      {/* Pricing */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Set Your Pricing *
                        </label>
                        <p className="text-sm text-gray-500 mb-4">
                          This is what students will pay to enroll with you, per plan. You can update
                          these later from your dashboard once approved.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Monthly (₦) *
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                              </div>
                              <input
                                {...registerPhase1('pricing.monthly', { 
                                  setValueAs: (v) => v === '' ? 0 : parseFloat(v) 
                                })}
                                type="number"
                                min={0}
                                step="1000"
                                placeholder="e.g. 15000"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            {phase1Errors.pricing?.monthly && (
                              <p className="mt-1 text-sm text-red-600">{phase1Errors.pricing.monthly.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              3 Months (₦) *
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                              </div>
                              <input
                                {...registerPhase1('pricing.threeMonths', { 
                                  setValueAs: (v) => v === '' ? 0 : parseFloat(v) 
                                })}
                                type="number"
                                min={0}
                                step="1000"
                                placeholder="e.g. 40000"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            {phase1Errors.pricing?.threeMonths && (
                              <p className="mt-1 text-sm text-red-600">{phase1Errors.pricing.threeMonths.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              6 Months (₦) *
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                              </div>
                              <input
                                {...registerPhase1('pricing.sixMonths', { 
                                  setValueAs: (v) => v === '' ? 0 : parseFloat(v) 
                                })}
                                type="number"
                                min={0}
                                step="1000"
                                placeholder="e.g. 75000"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            {phase1Errors.pricing?.sixMonths && (
                              <p className="mt-1 text-sm text-red-600">{phase1Errors.pricing.sixMonths.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              1 Year (₦) *
                            </label>
                            <div className="relative">
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <DollarSign className="w-4 h-4 text-gray-400" />
                              </div>
                              <input
                                {...registerPhase1('pricing.oneYear', { 
                                  setValueAs: (v) => v === '' ? 0 : parseFloat(v) 
                                })}
                                type="number"
                                min={0}
                                step="1000"
                                placeholder="e.g. 140000"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            {phase1Errors.pricing?.oneYear && (
                              <p className="mt-1 text-sm text-red-600">{phase1Errors.pricing.oneYear.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-end">
                      <button
                        type="submit"
                        disabled={uploading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploading ? 'Uploading...' : 'Continue to Account Setup'} 
                        {!uploading && <ArrowRight className="w-5 h-5" />}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {phase === 2 && (
                <motion.div
                  key="phase2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  <form onSubmit={handlePhase2Submit(onPhase2Submit)}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Setup</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          {...registerPhase2('password')}
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Create a strong password"
                        />
                        {phase2Errors.password && (
                          <p className="mt-1 text-sm text-red-600">{phase2Errors.password.message}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500">
                          Must be at least 8 characters long
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm Password *
                        </label>
                        <input
                          {...registerPhase2('confirmPassword')}
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm your password"
                        />
                        {phase2Errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">{phase2Errors.confirmPassword.message}</p>
                        )}
                      </div>
                      
                      <div className="flex items-start">
                        <input
                          {...registerPhase2('terms')}
                          type="checkbox"
                          className="mt-1 mr-3"
                        />
                        <label className="text-sm text-gray-700">
                          I agree to the{' '}
                          <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                          </Link>
                          . I understand that my application will be reviewed before I can start teaching.
                        </label>
                      </div>
                      {phase2Errors.terms && (
                        <p className="text-sm text-red-600">{phase2Errors.terms.message}</p>
                      )}
                      
                      {/* Application Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Application Summary</h3>
                        <p className="text-sm text-gray-600">
                          After submission, our team will review your application within 3-5 business days.
                          You'll receive an email notification once your application is approved.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex gap-4">
                      <button
                        type="button"
                        onClick={() => setPhase(1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition flex items-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5" /> Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Application <CheckCircle className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}