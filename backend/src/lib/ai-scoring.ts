import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ScoringResult {
  score: number // 0-100
  status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED'
  reasoning: string // transparent explanation
}

export interface ScoringInput {
  job: {
    title: string
    description: string
    required_skills: string[]
  }
  cvText: string
}

export class AIScoringEngine {
  private genAI: GoogleGenerativeAI | null = null
  private useGemini: boolean = false

  constructor() {
    // Use Gemini only - with key rotation/fallback
    const geminiKey = this.getGeminiApiKey()
    
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey)
      this.useGemini = true
    } else {
      this.useGemini = false
    }
  }

  /**
   * Get Gemini API key with rotation/fallback support
   * Tries: GEMINI_API_KEY -> GEMINI_API_KEY_002 -> GEMINI_API_KEY_003
   */
  private getGeminiApiKey(): string | null {
    return process.env.GEMINI_API_KEY 
      || process.env.GEMINI_API_KEY_002 
      || process.env.GEMINI_API_KEY_003 
      || null
  }

  /**
   * Score a candidate using AI
   * Input: { job: { title, description, required_skills }, cvText }
   * Output: { score: 0-100, status: "SHORTLIST" | "FLAGGED" | "REJECTED", reasoning: string }
   */
  async scoreCandidate(input: ScoringInput): Promise<ScoringResult> {
    const model = process.env.SCORING_MODEL || 'gemini-1.5-flash'

    if (!this.genAI && !this.useGemini) {
      // Fallback to rule-based scoring
      return this.fallbackScoring(input)
    }

    try {
      const prompt = this.buildScoringPrompt(input)
      
      if (this.useGemini && this.genAI) {
        // Use Gemini
        const geminiModel = this.genAI.getGenerativeModel({ 
          model: model.includes('gemini') ? model : 'gemini-1.5-flash' 
        })
        
        const systemInstruction = 'You are an expert HR recruiter. Analyze candidates objectively based ONLY on skills, experience, and job relevance. NO discrimination on gender, ethnicity, age, religion, or location. Base score purely on skills, experience, and relevance. Always return valid JSON.'
        
        const fullPrompt = `${systemInstruction}\n\n${prompt}`
        
        const result = await geminiModel.generateContent(fullPrompt)
        const response = await result.response
        const content = response.text() || '{}'
        
        // Extract JSON from response (Gemini might wrap it in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const jsonContent = jsonMatch ? jsonMatch[0] : content
        const parsed = JSON.parse(jsonContent) as { score: number; status: string; reasoning: string }

        // Validate and normalize
        const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
        let status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED' = 'REJECTED'
        
        // Mandatory scoring rules
        if (score >= 80) status = 'SHORTLIST'
        else if (score >= 50) status = 'FLAGGED'
        else status = 'REJECTED'

        return {
          score,
          status,
          reasoning: parsed.reasoning || 'No reasoning provided'
        }
      } else {
        // Fallback to rule-based
        return this.fallbackScoring(input)
      }
    } catch (error) {
      console.error('AI scoring failed, retrying with fallback:', error)
      // Retry once with simpler prompt
      try {
        return await this.retryScoring(input)
      } catch (retryError) {
        return this.fallbackScoring(input)
      }
    }
  }

  private buildScoringPrompt(input: ScoringInput): string {
    const cvText = input.cvText.substring(0, 4000) // Limit to prevent token overflow
    
    return `Analyze this candidate for the job position objectively.

JOB TITLE:
${input.job.title}

JOB DESCRIPTION:
${input.job.description}

REQUIRED SKILLS:
${input.job.required_skills.join(', ')}

CANDIDATE CV TEXT:
${cvText}${input.cvText.length > 4000 ? '...' : ''}

INSTRUCTIONS:
1. Analyze the job description and extract key requirements
2. Extract candidate skills from the CV text
3. Compare skill match between required skills and candidate skills
4. Score based on objective criteria: skill match, experience relevance, education alignment
5. NO discrimination: Do NOT consider gender, ethnicity, age, religion, or location
6. Base score purely on: skills, experience, relevance to job requirements

Return JSON with this EXACT structure:
{
  "score": <number 0-100>,
  "status": "SHORTLIST" | "FLAGGED" | "REJECTED",
  "reasoning": "<transparent explanation of why this score and status, list specific skills matched, experience relevance>"
}

MANDATORY SCORING RULES:
- 80-100 → SHORTLIST (strong match, meets most requirements)
- 50-79 → FLAGGED (partial match, needs review)
- <50 → REJECTED (poor match, doesn't meet requirements)

Consider ONLY: skill match percentage, years of relevant experience, education relevance, overall job fit.`
  }

  /**
   * Retry scoring with simpler prompt if initial attempt fails
   */
  private async retryScoring(input: ScoringInput): Promise<ScoringResult> {
    if (!this.genAI || !this.useGemini) {
      return this.fallbackScoring(input)
    }

    const simplePrompt = `Job: ${input.job.title}
Required Skills: ${input.job.required_skills.join(', ')}
CV: ${input.cvText.substring(0, 2000)}

Score 0-100 based on skill match. Return JSON: {"score": number, "status": "SHORTLIST"|"FLAGGED"|"REJECTED", "reasoning": "string"}`

    try {
      const geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await geminiModel.generateContent(`Return valid JSON only. Score objectively based on skills.\n\n${simplePrompt}`)
      const response = await result.response
      const content = response.text() || '{}'
      
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? jsonMatch[0] : content
      const parsed = JSON.parse(jsonContent) as { score: number; status: string; reasoning: string }
      
      const score = Math.max(0, Math.min(100, Math.round(parsed.score)))
      let status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED' = 'REJECTED'
      
      if (score >= 80) status = 'SHORTLIST'
      else if (score >= 50) status = 'FLAGGED'
      else status = 'REJECTED'

      return {
        score,
        status,
        reasoning: parsed.reasoning || 'Scored based on skill match'
      }
    } catch (error) {
      return this.fallbackScoring(input)
    }
  }

  private fallbackScoring(input: ScoringInput): ScoringResult {
    const cvText = input.cvText.toLowerCase()
    const requiredSkills = input.job.required_skills.map(s => s.toLowerCase())
    
    // Count skill matches
    let skillMatches = 0
    for (const skill of requiredSkills) {
      if (cvText.includes(skill)) {
        skillMatches++
      }
    }

    // Calculate score based on skill match percentage
    const skillMatchRatio = requiredSkills.length > 0 
      ? skillMatches / requiredSkills.length 
      : 0

    // Base score from skill matching (0-70 points)
    let score = Math.round(skillMatchRatio * 70)

    // Bonus points for experience indicators
    const experienceKeywords = ['experience', 'worked', 'years', 'developed', 'implemented', 'managed']
    const hasExperience = experienceKeywords.some(keyword => cvText.includes(keyword))
    if (hasExperience) score += 15

    // Bonus for education
    const educationKeywords = ['degree', 'bachelor', 'master', 'phd', 'university', 'college']
    const hasEducation = educationKeywords.some(keyword => cvText.includes(keyword))
    if (hasEducation) score += 10

    // Cap at 100
    score = Math.min(100, score)

    // Determine status (mandatory rules)
    let status: 'SHORTLIST' | 'FLAGGED' | 'REJECTED'
    let reasoning: string

    if (score >= 80) {
      status = 'SHORTLIST'
      reasoning = `Strong candidate with ${skillMatches}/${requiredSkills.length} required skills matched. Good experience and qualifications.`
    } else if (score >= 50) {
      status = 'FLAGGED'
      reasoning = `Partial match with ${skillMatches}/${requiredSkills.length} required skills. May need additional review.`
    } else {
      status = 'REJECTED'
      reasoning = `Weak match with only ${skillMatches}/${requiredSkills.length} required skills. Does not meet minimum requirements.`
    }

    return { score, status, reasoning }
  }
}

