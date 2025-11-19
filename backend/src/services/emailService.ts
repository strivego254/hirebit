import nodemailer from 'nodemailer'
import { logger } from '../utils/logger.js'
import fs from 'fs/promises'
import path from 'path'

export class EmailService {
  private transporter: nodemailer.Transporter

  private logFile: string

  constructor() {
    const mailHost = process.env.MAIL_HOST || 'smtp.gmail.com'
    const mailUser = process.env.MAIL_USER
    const mailPass = process.env.MAIL_PASS
    const mailFrom = 'hirebitapplications@gmail.com'

    this.transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false,
      auth: mailUser && mailPass ? {
        user: mailUser,
        pass: mailPass
      } : undefined
    })

    // Setup email log file
    this.logFile = path.join(process.cwd(), 'logs', 'email.log')
    this.ensureLogDirectory()
  }

  private async ensureLogDirectory() {
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true })
    } catch (error) {
      // Directory might already exist
    }
  }

  private async logEmail(to: string, subject: string, status: 'sent' | 'failed', error?: string) {
    try {
      const timestamp = new Date().toISOString()
      const logEntry = `[${timestamp}] ${status.toUpperCase()} | To: ${to} | Subject: ${subject}${error ? ` | Error: ${error}` : ''}\n`
      await fs.appendFile(this.logFile, logEntry)
    } catch (error) {
      logger.error('Failed to write email log:', error)
    }
  }

  /**
   * Candidate Acknowledgment Email (SHORTLISTED)
   * sendAcknowledgement(email, jobTitle, meetingLink)
   */
  async sendAcknowledgement(data: {
    email: string
    jobTitle: string
    meetingLink: string | null
    candidateName?: string
    companyName?: string
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #2D2DDD; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName || 'Candidate'},</p>
      <p>Great news! You've been shortlisted for the position of <strong>${data.jobTitle}</strong>.</p>
      ${data.meetingLink ? `
      <p>Meeting link: <a href="${data.meetingLink}" class="button">Join Interview</a></p>
      <p><strong>Note:</strong> Interview time will be shared separately via email.</p>
      ` : '<p>Interview details will be shared soon via email.</p>'}
      <p>Best regards,<br>${data.companyName || 'Hiring Team'}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Congratulations!

Hi ${data.candidateName || 'Candidate'},

Great news! You've been shortlisted for the position of ${data.jobTitle}.

${data.meetingLink ? `Meeting link: ${data.meetingLink}\n\nNote: Interview time will be shared separately via email.` : 'Interview details will be shared soon via email.'}

Best regards,
${data.companyName || 'Hiring Team'}
    `

    await this.sendEmail({
      to: data.email,
      subject: `Congratulations! You've been shortlisted for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendShortlistEmail(data: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    companyEmail?: string | null
    companyDomain?: string | null
    interviewLink: string | null
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #2D2DDD; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName},</p>
      <p>Great news! You've been shortlisted for the position of <strong>${data.jobTitle}</strong>.</p>
      ${data.interviewLink ? `
      <p>Interview details will be shared soon. Meeting link: <a href="${data.interviewLink}">${data.interviewLink}</a></p>
      ` : ''}
      <p>We'll notify you about the interview time shortly.</p>
      <p>Best regards,<br>${data.companyName} Team</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Congratulations!

Hi ${data.candidateName},

Great news! You've been shortlisted for the position of ${data.jobTitle}.

${data.interviewLink ? `Interview link: ${data.interviewLink}` : 'Interview details will be shared soon.'}

We'll notify you about the interview time shortly.

Best regards,
${data.companyName} Team
    `

    // Generate from email: use company_email, companyDomain, or fallback
    const fromEmail = this.getCompanyEmail(data.companyEmail, data.companyDomain, data.companyName)
    
    await this.sendEmail({
      to: data.candidateEmail,
      from: fromEmail,
      subject: `Congratulations! You've been shortlisted for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendRejectionEmail(data: {
    candidateEmail: string
    candidateName: string
    jobTitle: string
    companyName: string
    companyEmail?: string | null
    companyDomain?: string | null
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #666; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName},</p>
      <p>Thank you for your interest in the <strong>${data.jobTitle}</strong> position.</p>
      <p>After careful review, we have decided to move forward with other candidates at this time.</p>
      <p>We appreciate your interest and wish you the best in your job search.</p>
      <p>Best regards,<br>${data.companyName} Team</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Application Update

Hi ${data.candidateName},

Thank you for your interest in the ${data.jobTitle} position.

After careful review, we have decided to move forward with other candidates at this time.

We appreciate your interest and wish you the best in your job search.

Best regards,
${data.companyName} Team
    `

    // Generate from email: use company_email, companyDomain, or fallback
    const fromEmail = this.getCompanyEmail(data.companyEmail, data.companyDomain, data.companyName)
    
    await this.sendEmail({
      to: data.candidateEmail,
      from: fromEmail,
      subject: `Application Update - ${data.jobTitle}`,
      html,
      text
    })
  }

  /**
   * HR Notification for Every New Applicant
   * sendHRNotification(hr_email, candidate_name, score, status)
   */
  async sendHRNotification(data: {
    hrEmail: string
    candidateName: string
    candidateEmail: string
    jobTitle: string
    companyName: string
    score?: number | null
    status?: string | null
  }) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Applicant Received</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>A new application has been received for <strong>${data.jobTitle}</strong>.</p>
      <p><strong>Candidate:</strong> ${data.candidateName}</p>
      <p><strong>Email:</strong> ${data.candidateEmail}</p>
      ${data.score !== null && data.score !== undefined ? `<p><strong>Score:</strong> ${data.score}/100</p>` : ''}
      ${data.status ? `<p><strong>Status:</strong> ${data.status}</p>` : ''}
      <p>${data.score !== null && data.score !== undefined ? 'The candidate has been evaluated.' : 'The candidate is being processed and scored. You\'ll receive updates once the evaluation is complete.'}</p>
      <p>Best regards,<br>HireBit System</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
New Applicant Received

A new application has been received for ${data.jobTitle}.

Candidate: ${data.candidateName}
Email: ${data.candidateEmail}
${data.score !== null && data.score !== undefined ? `Score: ${data.score}/100` : ''}
${data.status ? `Status: ${data.status}` : ''}

${data.score !== null && data.score !== undefined ? 'The candidate has been evaluated.' : 'The candidate is being processed and scored. You\'ll receive updates once the evaluation is complete.'}

Best regards,
HireBit System
    `

    await this.sendEmail({
      to: data.hrEmail,
      subject: `New Applicant Received for ${data.jobTitle}`,
      html,
      text
    })
  }

  /**
   * Generate company noreply email address
   * Priority: company_email > noreply@company_domain > noreply@sanitized_company_name.com > env fallback
   */
  getCompanyEmail(companyEmail: string | null | undefined, companyDomain: string | null | undefined, companyName: string): string {
    // If company_email exists, use it
    if (companyEmail) {
      return companyEmail
    }
    
    // If company_domain exists, use noreply@domain
    if (companyDomain) {
      // Remove http://, https://, www. if present
      const cleanDomain = companyDomain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .toLowerCase()
      return `noreply@${cleanDomain}`
    }
    
    // Fallback: generate from company name (sanitized)
    if (companyName) {
      const sanitized = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20)
      return `noreply@${sanitized}.com`
    }
    
    // Final fallback - use hirebitapplications@gmail.com
    return 'hirebitapplications@gmail.com'
  }

  /**
   * Interview Scheduled Email
   * sendInterviewSchedule(candidate_email, jobTitle, meeting_time, meetingLink)
   */
  async sendInterviewSchedule(data: {
    candidate_email: string
    jobTitle: string
    meeting_time: string
    meetingLink: string
    candidateName?: string
    companyName?: string
  }) {
    const meetingDate = new Date(data.meeting_time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #2D2DDD; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #2D2DDD; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Scheduled</h1>
    </div>
    <div class="content">
      <p>Hi ${data.candidateName || 'Candidate'},</p>
      <p>Your interview for <strong>${data.jobTitle}</strong> has been scheduled.</p>
      <div class="info-box">
        <p><strong>Date & Time:</strong> ${meetingDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${data.meetingLink}" class="button">Join Interview</a></p>
      </div>
      <p>Please arrive 5 minutes early and have your documents ready.</p>
      <p>Best regards,<br>${data.companyName || 'Hiring Team'}</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Interview Scheduled

Hi ${data.candidateName || 'Candidate'},

Your interview for ${data.jobTitle} has been scheduled.

Date & Time: ${meetingDate}
Meeting Link: ${data.meetingLink}

Please arrive 5 minutes early and have your documents ready.

Best regards,
${data.companyName || 'Hiring Team'}
    `

    await this.sendEmail({
      to: data.candidate_email,
      subject: `Interview Scheduled - ${data.jobTitle}`,
      html,
      text
    })
  }

  /**
   * HR Interview Confirmation Email
   * sendHRInterviewConfirmation(hr_email, candidate, time)
   */
  async sendHRInterviewConfirmation(data: {
    hr_email: string
    candidate: {
      name: string
      email: string
    }
    time: string
    jobTitle: string
    meetingLink: string
    companyName?: string
  }) {
    const meetingDate = new Date(data.time).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2D2DDD; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .info-box { background: white; padding: 15px; border-left: 4px solid #2D2DDD; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Confirmed</h1>
    </div>
    <div class="content">
      <p>Hi,</p>
      <p>An interview has been scheduled:</p>
      <div class="info-box">
        <p><strong>Candidate:</strong> ${data.candidate.name} (${data.candidate.email})</p>
        <p><strong>Job:</strong> ${data.jobTitle}</p>
        <p><strong>Date & Time:</strong> ${meetingDate}</p>
        <p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">${data.meetingLink}</a></p>
      </div>
      <p>Best regards,<br>HireBit System</p>
    </div>
  </div>
</body>
</html>
    `

    const text = `
Interview Confirmed

An interview has been scheduled:

Candidate: ${data.candidate.name} (${data.candidate.email})
Job: ${data.jobTitle}
Date & Time: ${meetingDate}
Meeting Link: ${data.meetingLink}

Best regards,
HireBit System
    `

    await this.sendEmail({
      to: data.hr_email,
      subject: `Interview Scheduled - ${data.candidate.name} for ${data.jobTitle}`,
      html,
      text
    })
  }

  async sendEmail(data: {
    to: string
    subject: string
    html: string
    text: string
    from?: string
  }) {
    try {
      const from = data.from || 'hirebitapplications@gmail.com'
      
      await this.transporter.sendMail({
        from,
        to: data.to,
        subject: data.subject,
        html: data.html,
        text: data.text
      })

      logger.info(`Email sent to ${data.to}: ${data.subject}`)
      await this.logEmail(data.to, data.subject, 'sent')
    } catch (error: any) {
      const errorMsg = error?.message || String(error)
      logger.error(`Failed to send email to ${data.to}:`, error)
      await this.logEmail(data.to, data.subject, 'failed', errorMsg)
      throw error
    }
  }
}

