'use client';

import { useState, useEffect } from 'react';
import { Upload, Search, Trash2 } from 'lucide-react';

interface Voter {
  id: string;
  name: string;
  voterNo: string;
  father: string;
  address: string;
  pdfName: string;
}

export default function VoterSearch() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('voterData');
    if (saved) setVoters(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('voterData', JSON.stringify(voters));
  }, [voters]);

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setProgress(`Tesseract OCR চলছে... ${file.name}`);

    try {
      // Tesseract.js লোড
      const { createWorker } = await import('tesseract.js');
      
      const worker = await createWorker(['ben', 'eng'], 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(`OCR চলছে... ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      // টেক্সট পার্সিং
      const lines = text.split('\n');
      const newVoters: Voter[] = [];

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        const nameMatch = trimmed.match(/নাম[:\s]*([^\n\u0964]+)/i);
        const voterNoMatch = trimmed.match(/ভোটার নং[:\s]*([০-৯]+)/i);

        if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
          newVoters.push({
            id: Date.now() + '-' + idx,
            name: nameMatch[1].trim(),
            voterNo: voterNoMatch ? voterNoMatch[1] : 'N/A',
            father: 'পিতা: তথ্য পাওয়া যায়নি',
            address: 'ঠিকানা: তথ্য পাওয়া যায়নি',
            pdfName: file.name
          });
        }
      });

      if (newVoters.length > 0) {
        setVoters(prev => [...prev, ...newVoters]);
        setProgress(`✅ সফল! ${newVoters.length} জন ভোটার যোগ হয়েছে`);
      } else {
        setProgress('⚠️ কোনো তথ্য পাওয়া যায়নি। অন্য PDF চেষ্টা করুন।');
      }
    } catch (err) {
      console.error(err);
      setProgress('❌ Tesseract OCR এ সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }

    setIsProcessing(false);
  };

  const filtered = voters.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.voterNo.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
          Live Voter Data Search (Tesseract OCR)
        </h1>

        <div className="bg-white rounded-2xl shadow p-8 text-center mb-8">
          <Upload className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <p className="mb-6 text-lg">ভোটার লিস্টের PDF আপলোড করুন</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl text-lg inline-block">
            📄 PDF আপলোড করুন (Tesseract OCR)
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) processPDF(file);
              }}
            />
          </label>
        </div>

        {isProcessing && (
          <div className="bg-blue-50 p-6 rounded-xl text-center mb-6 font-medium">
            {progress}
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="নাম বা ভোটার নং দিয়ে সার্চ করুন..."
            className="w-full px-5 py-4 rounded-2xl border text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">মোট ভোটার: {voters.length}</h2>
          <button 
            onClick={() => { if(confirm('সব মুছে ফেলবেন?')) {setVoters([]); localStorage.clear();} }}
            className="text-red-600 flex items-center gap-2"
          >
            <Trash2 /> সব মুছে ফেলুন
          </button>
        </div>

        <div className="space-y-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white p-6 rounded-2xl shadow">
              <p className="text-2xl font-bold">{v.name}</p>
              <p className="text-xl font-mono mt-2">{v.voterNo}</p>
              <p className="text-gray-600 mt-3">{v.father}</p>
              <p className="text-xs text-gray-400 mt-4">ফাইল: {v.pdfName}</p>
            </div>
          ))}
        </div>

        {voters.length === 0 && <p className="text-center text-gray-500 mt-20">PDF আপলোড করে শুরু করুন</p>}
      </div>
    </div>
  );
}
