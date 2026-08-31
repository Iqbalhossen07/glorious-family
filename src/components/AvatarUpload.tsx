'use client'
import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import Swal from 'sweetalert2'
import { supabase } from '@/lib/supabase'

export default function AvatarUpload({ currentUrl, onUploadSuccess, userName }: { currentUrl?: string, onUploadSuccess: (url: string) => void, userName: string }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(currentUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Please select a valid image file', 'error')
      return
    }

    try {
      setLoading(true)

      // 1. Compress Image
      const options = {
        maxSizeMB: 0.1, // Compress to ~100KB max
        maxWidthOrHeight: 800,
        useWebWorker: true
      }
      const compressedFile = await imageCompression(file, options)

      // 2. Prepare for upload
      const formData = new FormData()
      formData.append('file', compressedFile)
      formData.append('bucket', 'avatars')
      const ext = file.name.split('.').pop()
      const path = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      formData.append('path', path)

      // 3. Upload via API (Bypasses RLS using Service Role)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      const uploadedUrl = data.url
      setPreview(uploadedUrl)

      // 4. Update Supabase Auth user_metadata
      await supabase.auth.updateUser({
        data: { avatar_url: uploadedUrl }
      })

      onUploadSuccess(uploadedUrl)
      Swal.fire({
        icon: 'success',
        title: 'Profile picture updated!',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      })

    } catch (error: any) {
      console.error('Upload Error:', error)
      Swal.fire('Error', error.message || 'Failed to upload image', 'error')
      setPreview(currentUrl) // revert on fail
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const initials = userName ? userName.charAt(0).toUpperCase() : 'U'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div 
        style={{ 
          width: '100px', height: '100px', borderRadius: '50%', 
          background: 'var(--primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', fontWeight: 800,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(12, 173, 121, 0.25)',
          border: '4px solid #fff'
        }}
      >
        {preview ? (
          <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials
        )}

        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          style={{
            position: 'absolute', bottom: 0, left: 0, width: '100%', height: '35%',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading ? <Loader2 size={18} className="spin" color="#fff" /> : <Camera size={18} color="#fff" />}
        </div>
      </div>
      
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Click the camera icon to upload a photo
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
