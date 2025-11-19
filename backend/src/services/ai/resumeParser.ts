import { GoogleGenerativeAI } from '@google/generative-ai'

type ParsedResume = {
  personal?: { name?: string; email?: string; phone?: string }
  education?: Array<{ school?: string; degree?: string; year?: string }>
  experience?: Array<{ company?: string; role?: string; start?: string; end?: string; summary?: string }>
  skills?: string[]
  links?: { github?: string; linkedin?: string; portfolio?: string[] }
  awards?: string[]
  projects?: Array<{ name?: string; description?: string; link?: string }>
}

/**
 * Get Gemini API key with rotation/fallback support
 * Tries: GEMINI_API_KEY -> GEMINI_API_KEY_002 -> GEMINI_API_KEY_003
 */
function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY 
    || process.env.GEMINI_API_KEY_002 
    || process.env.GEMINI_API_KEY_003 
    || null
}

export async function parseResumeText(text: string): Promise<ParsedResume> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    // Fallback minimal heuristic parse
    return {
      personal: {},
      skills: [],
      links: {},
      education: [],
      experience: [],
      awards: [],
      projects: []
    }
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const systemInstruction = `You are a resume parsing engine. Extract JSON with keys:
personal{name,email,phone}, education[{school,degree,year}], experience[{company,role,start,end,summary}],
skills[string[]], links{github,linkedin,portfolio[string[]]}, awards[string[]], projects[{name,description,link}].
Return ONLY strict JSON, no markdown formatting.`

    const prompt = `Resume Text:\n${text}\n---\nExtract the structured JSON now.`

    const result = await model.generateContent(`${systemInstruction}\n\n${prompt}`)
    const response = await result.response
    const content = response.text() || '{}'
    
    // Extract JSON from response (Gemini might wrap it in markdown)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const jsonContent = jsonMatch ? jsonMatch[0] : content
    
    return JSON.parse(jsonContent) as ParsedResume
  } catch (error) {
    console.error('Gemini resume parsing failed:', error)
    return {
      personal: {},
      skills: [],
      links: {},
      education: [],
      experience: [],
      awards: [],
      projects: []
    }
  }
}


