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
    setProgress(`প্রসেস হচ্ছে: ${file.name}`);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`পেজ ${i}/${pdf.numPages} চলছে...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
      }

      // Basic parsing for Bengali voter list
      const newVoters: Voter[] = [];
      const lines = fullText.split('\n');

      lines.forEach((line, idx) => {
        const nameMatch = line.match(/নাম[:\s]*([^\n]+)/i);
        const voterNoMatch = line.match(/ভোটার নং[:\s]*([০-৯]+)/i);

        if (nameMatch && nameMatch[1].trim().length > 2) {
          newVoters.push({
            id: Date.now() + '-' + idx,
            name: nameMatch[1].trim(),
            voterNo: voterNoMatch ? voterNoMatch[1] : 'N/A',
            father: 'পিতা তথ্য পাওয়া যায়নি',
            address: 'ঠিকানা পাওয়া যায়নি',
            pdfName: file.name
          });
        }
      });

      if (newVoters.length > 0) {
        setVoters(prev => [...prev, ...newVoters]);
        setProgress(`${newVoters.length} জন ভোটার যোগ হয়েছে`);
      } else {
        setProgress('কোনো ভোটার তথ্য পাওয়া যায়নি। অন্য PDF চেষ্টা করুন।');
      }
    } catch (err) {
      console.error(err);
      alert('PDF প্রসেস করতে সমস্যা হয়েছে। অন্য একটা PDF চেষ্টা করুন।');
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
          <p className="mb-6">ভোটার লিস্টের PDF আপলোড করুন</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl inline-block text-lg">
            PDF আপলোড করুন
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

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="নাম বা ভোটার নং দিয়ে সার্চ করুন..."
            className="w-full pl-5 pr-4 py-4 rounded-2xl border text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex justify-between mb-4">
          <h2>মোট ভোটার: {voters.length}</h2>
          <button onClick={() => {setVoters([]); localStorage.clear();}} className="text-red-600 flex items-center gap-1">
            <Trash2 size={18} /> সব মুছে ফেলুন
          </button>
        </div>

        <div className="space-y-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white p-5 rounded-2xl shadow">
              <p className="text-xl font-bold">{v.name}</p>
              <p className="text-lg font-mono mt-1">{v.voterNo}</p>
              <p className="text-sm text-gray-600 mt-2">{v.father}</p>
              <p className="text-xs text-gray-400 mt-3">ফাইল: {v.pdfName}</p>
            </div>
          ))}
        </div>

        {voters.length === 0 && <p className="text-center text-gray-500 mt-20">PDF আপলোড করে শুরু করুন</p>}
      </div>
    </div>
  );
}
