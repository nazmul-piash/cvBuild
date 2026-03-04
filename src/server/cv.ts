import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { GoogleGenAI } from '@google/genai';
import db from './db.ts';
import { authenticateToken, AuthRequest } from './middleware.ts';
import { generatePDF } from './pdf.ts';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Upload and Optimize CV
router.post('/optimize', authenticateToken, upload.single('cv'), async (req: AuthRequest, res) => {
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
    const response = await genAI.models.generateContent({
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

    const optimizedContent = response.text;

    // Store in DB
    const stmt = db.prepare(`
      INSERT INTO cvs (user_id, original_filename, extracted_text, job_description, optimized_content)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(req.user!.id, file.originalname, extractedText, jobDescription, optimizedContent);

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    res.json({ 
      message: 'CV optimized successfully', 
      id: info.lastInsertRowid,
      optimizedContent 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing CV' });
  }
});

// Download PDF
router.get('/download/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM cvs WHERE id = ? AND user_id = ?');
    const cv = stmt.get(req.params.id, req.user!.id) as any;

    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    const pdfPath = path.join('uploads', `cv-${cv.id}.pdf`);
    
    // Generate PDF if it doesn't exist (or always regenerate for MVP simplicity)
    await generatePDF(cv.optimized_content, pdfPath);

    res.download(pdfPath, 'Lebenslauf_Optimized.pdf', (err) => {
      if (err) {
        console.error(err);
      }
      // Optional: delete file after download
      // fs.unlinkSync(pdfPath); 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generating PDF' });
  }
});

// Get History
router.get('/history', authenticateToken, (req: AuthRequest, res) => {
  try {
    const stmt = db.prepare('SELECT id, original_filename, created_at FROM cvs WHERE user_id = ? ORDER BY created_at DESC');
    const cvs = stmt.all(req.user!.id);
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
