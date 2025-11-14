'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { WebhookTest } from '../webhook-test'

interface CompanyData {
  id: string
  company_name: string
  company_email: string
  hr_email: string
  created_at: string
}

export function SettingsSection() {
  const { user } = useAuth()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    hr_email: '',
  })

  const loadCompanyData = useCallback(async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('companies')
        .select('id, company_name, company_email, hr_email, created_at')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading company:', error)
        return
      }

      if (data) {
        setCompany(data)
        setFormData({
          company_name: data.company_name || '',
          company_email: data.company_email || '',
          hr_email: data.hr_email || '',
        })
      }
    } catch (error) {
      console.error('Error loading company data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadCompanyData()
    }
  }, [user, loadCompanyData])

  const handleSave = async () => {
    if (!user || !company) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: formData.company_name,
          company_email: formData.company_email,
          hr_email: formData.hr_email,
        })
        .eq('id', company.id)

      if (error) {
        throw error
      }

      setSaveMessage({ type: 'success', text: 'Company settings updated successfully!' })
      await loadCompanyData()
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving company settings:', error)
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update company settings' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
        className="gpu-accelerated"
      >
        <h1 className="text-2xl md:text-3xl font-figtree font-extralight mb-2 text-[#2D2DDD] dark:text-white">
          Settings
        </h1>
        <p className="text-base md:text-lg font-figtree font-light text-gray-600 dark:text-gray-400">
          Manage your account and company preferences
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <User className="w-5 h-5 text-[#2D2DDD]" />
              Account Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Your account details and login information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userId" className="text-gray-700 dark:text-gray-300">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={user?.id || ''}
                disabled
                className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono text-xs"
              />
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
              <Building2 className="w-5 h-5 text-[#2D2DDD]" />
              Company Information
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Update your company details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#2D2DDD]" />
              </div>
            ) : company ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-gray-700 dark:text-gray-300">Company Name</Label>
                  <Input
                    id="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Enter company name"
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_email" className="text-gray-700 dark:text-gray-300">Company Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                      placeholder="company@example.com"
                      className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hr_email" className="text-gray-700 dark:text-gray-300">HR Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="hr_email"
                      type="email"
                      value={formData.hr_email}
                      onChange={(e) => setFormData({ ...formData, hr_email: e.target.value })}
                      placeholder="hr@example.com"
                      className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                {saveMessage && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    saveMessage.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  }`}>
                    {saveMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <p className="text-sm">{saveMessage.text}</p>
                  </div>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-figtree font-light">
                  No company information found. Please complete company setup first.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Webhook Configuration */}
      <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5 text-[#2D2DDD]" />
            Webhook Integration
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Test and configure your N8N webhook connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhookTest />
        </CardContent>
      </Card>
    </div>
  )
}