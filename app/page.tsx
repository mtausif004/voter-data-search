'use client';

import { useState, useEffect } from 'react';
import { Upload, Search, Trash2, Download } from 'lucide-react';

interface Voter {
  id: string;
  serial: string;
  name: string;
  father: string;
  mother: string;
  birthDate: string;
  voterNo: string;
  address: string;
  pdfName?: string;
}

export default function VoterSearch() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);

  // Load from LocalStorage on start
  useEffect(() => {
    const saved = localStorage.getItem('voterData');
    if (saved) {
      setVoters(JSON.parse(saved));
    }
  }, []);

  // Save to LocalStorage whenever voters change
  useEffect(() => {
    localStorage.setItem('voterData', JSON.stringify(voters));
  }, [voters]);

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setProgress('PDF প্রসেস হচ্ছে...');
    setSelectedPDF(file);

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let allText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`পেজ ${i}/${pdf.numPages} প্রসেস হচ্ছে...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }

      // Simple parsing (আপনি পরে আরও উন্নত করতে পারবেন)
      const lines = allText.split('\n');
      const newVoters: Voter[] = [];

      lines.forEach((line, index) => {
        if (line.trim().length > 10 && (line.includes('নাম') || /^[০-৯]/.test(line))) {
          newVoters.push({
            id: Date.now() + '-' + index,
            serial: (voters.length + newVoters.length + 1).toString(),
            name: line.match(/নাম[:\s]*([^\n]+)/)?.[1]?.trim() || 'N/A',
            father: 'পিতা: নাম পাওয়া যায়নি',
            mother: 'মাতা: নাম পাওয়া যায়নি',
            birthDate: 'N/A',
            voterNo: line.match(/ভোটার নং[:\s]*([০-৯]+)/)?.[1] || 'N/A',
            address: 'ঠিকানা পাওয়া যায়নি',
            pdfName: file.name
          });
        }
      });

      setVoters(prev => [...prev, ...newVoters]);
      setProgress(`${newVoters.length} জন ভোটার যোগ হয়েছে!`);
    } catch (error) {
      console.error(error);
      alert('PDF প্রসেস করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setIsProcessing(false);
  };

  const filteredVoters = voters.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.voterNo.includes(searchTerm)
  );

  const clearAllData = () => {
    if (confirm('সব ডাটা মুছে ফেলবেন?')) {
      setVoters([]);
      localStorage.removeItem('voterData');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
          Live Voter Data Search
        </h1>

        {/* Upload Area */}
        <div className="bg-white p-8 rounded-2xl shadow mb-8 text-center">
          <Upload className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <p className="mb-6 text-lg">ভোটার লিস্টের PDF আপলোড করুন</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl inline-flex items-center gap-3 text-lg">
            <Upload size={24} /> PDF আপলোড করুন
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && processPDF(e.target.files[0])}
            />
          </label>
        </div>

        {isProcessing && <div className="bg-blue-50 p-6 rounded-xl text-center mb-6">{progress}</div>}

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-4 text-gray-400" size={24} />
          <input
            type="text"
            placeholder="নাম বা ভোটার নং দিয়ে সার্চ করুন..."
            className="w-full pl-14 pr-4 py-4 rounded-2xl border text-lg focus:outline-none focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">মোট ভোটার: {voters.length}</h2>
          <button
            onClick={clearAllData}
            className="text-red-600 flex items-center gap-2 hover:text-red-700"
          >
            <Trash2 size={20} /> সব মুছে ফেলুন
          </button>
        </div>

        <div className="grid gap-4">
          {filteredVoters.map((voter) => (
            <div key={voter.id} className="bg-white p-6 rounded-2xl shadow border">
              <div className="grid md:grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-gray-500">নাম</p>
                  <p className="text-xl font-bold">{voter.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ভোটার নং</p>
                  <p className="font-mono text-lg font-semibold">{voter.voterNo}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">পিতা</p>
                  <p>{voter.father}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">জন্ম তারিখ</p>
                  <p>{voter.birthDate}</p>
                </div>
              </div>
              {voter.pdfName && (
                <p className="text-xs text-gray-400 mt-4">ফাইল: {voter.pdfName}</p>
              )}
            </div>
          ))}
        </div>

        {voters.length === 0 && (
          <p className="text-center text-gray-500 mt-20">কোনো ডাটা নেই। PDF আপলোড করুন।</p>
        )}
      </div>
    </div>
  );
}
