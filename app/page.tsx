'use client';

import { useState } from 'react';
import { Upload, Search, Trash2, Download } from 'lucide-react';

interface Voter {
  serial: string;
  name: string;
  father: string;
  mother: string;
  birthDate: string;
  voterNo: string;
  address: string;
}

export default function VoterSearch() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const processPDF = async (file: File) => {
    setIsProcessing(true);
    setProgress('PDF লোড হচ্ছে...');

    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let allText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`পেজ ${i} প্রসেস হচ্ছে... (${i}/${pdf.numPages})`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
      }

      // Tesseract দিয়ে আরও ভালো OCR (বাংলা সাপোর্ট)
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('ben+eng', 1, {
        logger: (m) => setProgress(`OCR চলছে... ${Math.round(m.progress * 100)}%`)
      });

      const { data: { text } } = await worker.recognize(await file.arrayBuffer());
      await worker.terminate();

      // সিম্পল পার্সিং (আপনি পরে আরও উন্নত করতে পারবেন)
      const lines = text.split('\n');
      const extracted: Voter[] = [];

      for (let line of lines) {
        if (line.includes('নাম:') || line.match(/^[০-৯]/)) {
          extracted.push({
            serial: extracted.length + 1 + '',
            name: line.match(/নাম:\s*(.+?)(?=\s|পিতা|$)/)?.[1] || 'N/A',
            father: 'পিতা নাম পাওয়া যায়নি',
            mother: 'মাতা নাম পাওয়া যায়নি',
            birthDate: 'N/A',
            voterNo: line.match(/ভোটার নং[:\s]*([০-৯]+)/)?.[1] || 'N/A',
            address: 'ঠিকানা পাওয়া যায়নি'
          });
        }
      }

      setVoters(extracted);
      setProgress('সম্পন্ন হয়েছে!');
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">
          Live Voter Data Search
        </h1>

        {/* আপলোড এরিয়া */}
        <div className="bg-white p-8 rounded-xl shadow mb-8 text-center">
          <Upload className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <p className="mb-4 text-lg">ভোটার লিস্টের PDF আপলোড করুন</p>
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg inline-flex items-center gap-3">
            <Upload /> PDF আপলোড করুন
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && processPDF(e.target.files[0])}
            />
          </label>
        </div>

        {isProcessing && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-center">
            {progress}
          </div>
        )}

        {/* সার্চ বার */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="নাম, ভোটার নং, বা অন্য কিছু দিয়ে সার্চ করুন..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border focus:outline-none focus:border-blue-500 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* রেজাল্ট কার্ড */}
        <div className="grid gap-4">
          {filteredVoters.map((voter, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow border border-gray-100">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">নাম</p>
                  <p className="text-xl font-semibold">{voter.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ভোটার নং</p>
                  <p className="font-mono text-lg">{voter.voterNo}</p>
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
              <p className="mt-4 text-sm text-gray-600">{voter.address}</p>
            </div>
          ))}
        </div>

        {voters.length === 0 && !isProcessing && (
          <p className="text-center text-gray-500 mt-12">PDF আপলোড করে শুরু করুন</p>
        )}
      </div>
    </div>
  );
        }
