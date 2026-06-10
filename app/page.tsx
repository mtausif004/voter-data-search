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
    setProgress(`প্রসেস হচ্ছে: ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`পেজ ${i} / ${pdf.numPages} প্রসেস হচ্ছে...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => (item.str || '')).join(' ') + '\n';
      }

      // আরও শক্তিশালী পার্সিং
      const lines = fullText.split('\n');
      const newVoters: Voter[] = [];

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        const nameMatch = line.match(/নাম[:\s]*([^\n\u0964]+)/i);
        const voterNoMatch = line.match(/ভোটার নং[:\s]*([০-৯]+)/i);

        if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
          newVoters.push({
            id: Date.now() + Math.random().toString(),
            name: nameMatch[1].trim(),
            voterNo: voterNoMatch ? voterNoMatch[1] : 'N/A',
            father: 'পিতা তথ্য পাওয়া যায়নি',
            address: 'ঠিকানা পাওয়া যায়নি',
            pdfName: file.name
          });
        }
      }

      if (newVoters.length > 0) {
        setVoters(prev => [...prev, ...newVoters]);
        setProgress(`✅ ${newVoters.length} জন ভোটার সফলভাবে যোগ হয়েছে`);
      } else {
        setProgress('⚠️ কোনো তথ্য পাওয়া যায়নি। অন্য PDF চেষ্টা করুন বা ছবি ক্লিয়ার করে আপলোড করুন।');
      }
    } catch (err) {
      console.error(err);
      setProgress('❌ PDF প্রসেস করতে বড় সমস্যা হয়েছে। অন্য ছোট PDF চেষ্টা করুন।');
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
          Live Voter Data Search
        </h1>

        <div className="bg-white rounded-2xl shadow p-8 text-center mb-8">
          <Upload className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <p className="mb-6 text-lg">ভোটার লিস্টের PDF আপলোড করুন</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl text-lg inline-block">
            📄 PDF আপলোড করুন
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

        {isProcessing && <div className="bg-yellow-50 p-6 rounded-xl text-center mb-6 font-medium">{progress}</div>}

        <div className="mb-6">
          <input
            type="text"
            placeholder="নাম বা ভোটার নং দিয়ে সার্চ করুন..."
            className="w-full px-5 py-4 rounded-2xl border text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">মোট ভোটার: {voters.length}</h2>
          <button 
            onClick={() => { if(confirm('সব ডাটা মুছে ফেলবেন?')) {setVoters([]); localStorage.clear();} }}
            className="text-red-600 flex items-center gap-2"
          >
            <Trash2 /> সব মুছে ফেলুন
          </button>
        </div>

        <div className="space-y-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white p-6 rounded-2xl shadow">
              <p className="text-2xl font-bold text-blue-900">{v.name}</p>
              <p className="text-xl font-mono mt-2 text-gray-700">{v.voterNo}</p>
              <p className="mt-3 text-gray-600">{v.father}</p>
              <p className="text-xs text-gray-400 mt-4">ফাইল: {v.pdfName}</p>
            </div>
          ))}
        </div>

        {voters.length === 0 && <p className="text-center text-gray-500 mt-20">PDF আপলোড করে শুরু করুন</p>}
      </div>
    </div>
  );
          }
