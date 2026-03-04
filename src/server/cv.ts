import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { GoogleGenAI } from '@google/genai';
import { generatePDF } from './pdf.ts';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Middleware to verify Supabase token
const verifySupabaseToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization || (req.query.token ? `Bearer ${req.query.token}` : null);
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

// Upload and Optimize CV
router.post('/optimize', verifySupabaseToken, upload.single('cv'), async (req: any, res: any) => {
  try {
    const { jobDescription } = req.body;
    const file = req.file;

    if (!file || !jobDescription) {
      return res.status(400).json({ error: 'CV file and job description are required' });
    }

    let extractedText = '';

    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = result.value;
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload PDF or DOCX.' });
    }

    // Call Gemini API
    const aiResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      You are an expert German HR consultant. 
      Analyze the following CV and Job Description.
      
      CV Content:
      ${extractedText}
      
      Job Description:
      ${jobDescription}
      
      Task:
      1. Extract key skills and experiences from the CV that match the Job Description.
      2. Rewrite the CV content in a professional German "Lebenslauf" format.
      3. Do NOT fabricate any experience. Only use what is in the CV, but highlight relevant parts.
      4. The output should be structured text suitable for a CV.
      
      Output Format:
      - Personal Details (Placeholder if not found)
      - Professional Summary (Profil)
      - Work Experience (Berufserfahrung)
      - Education (Ausbildung)
      - Skills (Kenntnisse)
      
      Language: German
    `
    });

    const optimizedContent = aiResponse.text;

    // Store in Supabase
    const { data, error } = await supabase
      .from('cvs')
      .insert([
        { 
          user_id: req.user.id, 
          original_filename: file.originalname, 
          extracted_text: extractedText, 
          job_description: jobDescription, 
          optimized_content: optimizedContent 
        }
      ])
      .select();

    if (error) throw error;

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({ 
      message: 'CV optimized successfully', 
      id: data[0].id,
      optimizedContent 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing CV' });
  }
});

// Download PDF
router.get('/download/:id', verifySupabaseToken, async (req: any, res: any) => {
  try {
    const { data: cv, error } = await supabase
      .from('cvs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const pdfPath = path.join('uploads', `cv-${cv.id}.pdf`);
    await generatePDF(cv.optimized_content, pdfPath);

    res.download(pdfPath, 'Lebenslauf_Optimized.pdf');

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

export default router;
