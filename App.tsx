import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileImage, X, Check, Sparkles, Download, FileText, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button, Badge, Spinner } from './components/UI';
import { ProcessedImage, AppState } from './types';
import { analyzeImageWithGemini } from './services/geminiService';
import { generatePDF } from './services/pdfService';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles = Array.from(event.target.files) as File[];
      await processFiles(newFiles);
      // Reset input
      event.target.value = '';
    }
  };

  const processFiles = async (files: File[]) => {
    const newImages: ProcessedImage[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      isAnalyzing: false
    }));

    setImages(prev => [...prev, ...newImages]);

    // If AI is enabled immediately trigger analysis for new images
    if (useAI) {
      await analyzeImagesInBatch(newImages);
    }
  };

  const analyzeImagesInBatch = async (imgs: ProcessedImage[]) => {
    // Update state to show analyzing
    setImages(prev => prev.map(img => 
      imgs.find(i => i.id === img.id) ? { ...img, isAnalyzing: true } : img
    ));

    for (const img of imgs) {
      try {
        const base64Full = await fileToBase64(img.file);
        const base64Data = base64Full.split(',')[1];
        const mimeType = img.file.type;
        
        const description = await analyzeImageWithGemini(base64Data, mimeType);

        setImages(prev => prev.map(i => 
          i.id === img.id ? { ...i, isAnalyzing: false, aiDescription: description } : i
        ));
      } catch (e) {
        console.error("Analysis error", e);
        setImages(prev => prev.map(i => 
          i.id === img.id ? { ...i, isAnalyzing: false, aiDescription: "Analysis failed." } : i
        ));
      }
    }
  };

  const toggleAI = async () => {
    const newValue = !useAI;
    setUseAI(newValue);
    
    if (newValue) {
      // Analyze images that haven't been analyzed yet
      const unanalyzed = images.filter(i => !i.aiDescription);
      if (unanalyzed.length > 0) {
        await analyzeImagesInBatch(unanalyzed);
      }
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setPdfBlob(null); // Reset PDF if content changes
  };

  const handleGeneratePDF = async () => {
    setAppState(AppState.PROCESSING);
    setError(null);
    try {
      const blob = await generatePDF(images, useAI);
      setPdfBlob(blob);
      setAppState(AppState.COMPLETE);
    } catch (err) {
      console.error(err);
      setError("Failed to generate PDF. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const downloadPDF = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_doc_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0f172a] to-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      
      {/* Navigation */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Lumina<span className="text-indigo-400">PDF</span></span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                Powered by Gemini 2.5
              </a>
              <div className="w-px h-4 bg-white/10"></div>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                System Ready
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
            Transform Images to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Intelligent PDFs</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Drag, drop, and compile your visual assets into professional documents. 
            Enable AI to automatically caption and analyze your content.
          </p>
        </div>

        {/* Controls & Actions */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/20 border border-indigo-500/50 group"
              >
                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Upload Images
              </button>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                ref={fileInputRef}
                onChange={handleFileSelect} 
                className="hidden"
              />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div 
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all cursor-pointer select-none ${useAI ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              onClick={toggleAI}
            >
              <div className={`w-10 h-5 rounded-full relative transition-colors ${useAI ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${useAI ? 'left-6' : 'left-1'}`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  AI Enhancement <Sparkles className="w-3 h-3 text-amber-400" />
                </span>
                <span className="text-[10px] text-slate-400">Auto-caption & OCR</span>
              </div>
            </div>

            {images.length > 0 && (
              <Button 
                onClick={handleGeneratePDF} 
                disabled={appState === AppState.PROCESSING}
                variant="secondary"
              >
                {appState === AppState.PROCESSING ? (
                  <>
                    <Spinner /> Processing...
                  </>
                ) : (
                  <>Convert {images.length} Files</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Image Grid */}
        {images.length === 0 ? (
          <div 
            className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-300 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <FileImage className="w-10 h-10 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No images selected</h3>
            <p className="text-slate-500">Click here or start by uploading your images</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, index) => (
              <div key={img.id} className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:shadow-xl hover:shadow-black/20">
                <div className="aspect-video bg-black/40 relative overflow-hidden">
                  <img src={img.previewUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-2 left-2">
                    <Badge>{index + 1}</Badge>
                  </div>
                  <button 
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500/80 rounded-lg backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-200 truncate pr-4">{img.file.name}</h4>
                    <span className="text-xs text-slate-500">{(img.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  
                  {useAI && (
                    <div className="mt-3 pt-3 border-t border-white/5 min-h-[60px]">
                      {img.isAnalyzing ? (
                        <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          Analyzing image content...
                        </div>
                      ) : img.aiDescription ? (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          <span className="text-indigo-400 font-medium mr-1">AI:</span>
                          {img.aiDescription}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">Pending analysis...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Success / Download Section */}
        {appState === AppState.COMPLETE && pdfBlob && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-emerald-900/90 backdrop-blur-xl border border-emerald-500/30 p-1.5 pr-6 rounded-full shadow-2xl shadow-black/50 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">PDF Ready!</span>
                <span className="text-xs text-emerald-200">Generated successfully</span>
              </div>
              <div className="h-8 w-px bg-emerald-500/30 mx-2"></div>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-white text-emerald-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-emerald-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button 
                onClick={() => setAppState(AppState.IDLE)}
                className="ml-2 p-1 hover:bg-emerald-800/50 rounded-full text-emerald-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}