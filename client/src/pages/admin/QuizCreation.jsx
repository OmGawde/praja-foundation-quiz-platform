import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function QuizCreation() {
  const { roundId, quizId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!quizId;
  const csvInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [maxTeams, setMaxTeams] = useState(50);
  const [joinCode, setJoinCode] = useState('—');
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [csvImportCount, setCsvImportCount] = useState(0);

  function createEmptyQuestion() {
    return { questionText: '', type: 'text', options: ['', '', '', ''], correctAnswerIndex: 0, timeLimit: 30, mediaUrl: '' };
  }

  useEffect(() => {
    if (isEdit) {
      api.get(`/quizzes/${quizId}`).then(res => {
        const q = res.data;
        setTitle(q.title);
        setMaxTeams(q.maxTeams);
        setJoinCode(q.joinCode);
        if (q.questions?.length > 0) {
          setQuestions(q.questions.map(qu => ({
            _id: qu._id, questionText: qu.questionText, type: qu.type,
            options: qu.options, correctAnswerIndex: qu.correctAnswerIndex,
            timeLimit: qu.timeLimit, mediaUrl: qu.mediaUrl || ''
          })));
        }
      }).catch(() => toast.error('Failed to load quiz'));
    }
  }, [quizId]);

  const updateQuestion = (idx, field, value) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    setQuestions(updated);
  };

  const addQuestion = () => setQuestions([...questions, createEmptyQuestion()]);
  const removeQuestion = (idx) => setQuestions(questions.filter((_, i) => i !== idx));

  const addOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], options: [...updated[qIdx].options, ''] };
    setQuestions(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = [...questions];
    updated[qIdx] = { ...updated[qIdx], options: updated[qIdx].options.filter((_, i) => i !== oIdx) };
    if (updated[qIdx].correctAnswerIndex >= updated[qIdx].options.length) updated[qIdx].correctAnswerIndex = 0;
    setQuestions(updated);
  };

  // File type and size restrictions
  const MEDIA_ACCEPT = {
    image: { accept: '.jpg,.jpeg,.png,.gif,.webp', maxMB: 10, label: 'Image' },
    audio: { accept: '.mp3,.wav,.ogg', maxMB: 10, label: 'Audio' },
    video: { accept: '.mp4,.webm,.ogv', maxMB: 25, label: 'Video' },
  };

  const handleMediaUpload = async (qIdx, file) => {
    const qType = questions[qIdx].type;
    const config = MEDIA_ACCEPT[qType];
    if (!config) return toast.error('Invalid question type for media upload');

    // Client-side size check
    const maxBytes = config.maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return toast.error(`${config.label} files must be under ${config.maxMB} MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`);
    }

    // Client-side extension check
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const allowedExts = config.accept.split(',');
    if (!allowedExts.includes(ext)) {
      return toast.error(`Invalid file type. Allowed: ${config.accept}`);
    }

    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateQuestion(qIdx, 'mediaUrl', res.data.url);
      toast.success('Media uploaded');
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      toast.error(msg);
    }
  };

  // ═══════════════════════════════════════════
  // CSV TEMPLATE — Download & Import
  // ═══════════════════════════════════════════

  const downloadCSVTemplate = () => {
    const headers = ['questionText', 'option1', 'option2', 'option3', 'option4', 'correctOption', 'timeLimit'];
    const exampleRows = [
      ['What is the capital of India?', 'Mumbai', 'Delhi', 'Chennai', 'Kolkata', '2', '30'],
      ['Which planet is closest to the Sun?', 'Venus', 'Mercury', '', '', '2', '30'],
      ['What is 2 + 2?', '3', '4', '5', '', '2', '15'],
    ];

    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quiz_questions_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded! Fill it in and import it back.');
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleCSVImport = (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv') {
      return toast.error('Please upload a .csv file');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim());

        if (lines.length < 2) {
          return toast.error('CSV file is empty or has no data rows');
        }

        // Parse header row
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

        // Validate required columns
        const qTextIdx = headers.findIndex(h => h === 'questiontext');
        const opt1Idx = headers.findIndex(h => h === 'option1');
        const opt2Idx = headers.findIndex(h => h === 'option2');
        const opt3Idx = headers.findIndex(h => h === 'option3');
        const opt4Idx = headers.findIndex(h => h === 'option4');
        const correctIdx = headers.findIndex(h => h === 'correctoption');
        const timeLimitIdx = headers.findIndex(h => h === 'timelimit');

        if (qTextIdx === -1 || opt1Idx === -1 || opt2Idx === -1 || correctIdx === -1) {
          return toast.error('CSV must have columns: questionText, option1, option2, correctOption');
        }

        const importedQuestions = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const questionText = values[qTextIdx]?.trim() || '';

          if (!questionText) continue; // skip empty rows

          // Collect options (2-4), filtering empty ones
          const options = [
            values[opt1Idx]?.trim() || '',
            values[opt2Idx]?.trim() || '',
            opt3Idx !== -1 ? (values[opt3Idx]?.trim() || '') : '',
            opt4Idx !== -1 ? (values[opt4Idx]?.trim() || '') : '',
          ].filter(o => o !== '');

          if (options.length < 2) {
            errors.push(`Row ${i + 1}: Need at least 2 options`);
            continue;
          }
          if (options.length > 4) {
            errors.push(`Row ${i + 1}: Maximum 4 options allowed`);
            continue;
          }

          // Parse correct option (1-indexed in CSV → 0-indexed internally)
          const correctOption = parseInt(values[correctIdx]) || 1;
          const correctAnswerIndex = Math.max(0, Math.min(correctOption - 1, options.length - 1));

          // Parse time limit
          const timeLimit = timeLimitIdx !== -1 ? (parseInt(values[timeLimitIdx]) || 30) : 30;
          const validTimeLimits = [15, 30, 60, 120];
          const finalTimeLimit = validTimeLimits.includes(timeLimit) ? timeLimit : 30;

          importedQuestions.push({
            questionText,
            type: 'text',
            options,
            correctAnswerIndex,
            timeLimit: finalTimeLimit,
            mediaUrl: '',
          });
        }

        if (importedQuestions.length === 0) {
          return toast.error('No valid questions found in CSV');
        }

        // If the current questions list has only one empty question, replace it; otherwise append
        const hasOnlyEmptyDefault = questions.length === 1 && !questions[0].questionText.trim();
        if (hasOnlyEmptyDefault) {
          setQuestions(importedQuestions);
        } else {
          setQuestions([...questions, ...importedQuestions]);
        }

        setCsvImportCount(importedQuestions.length);
        toast.success(`${importedQuestions.length} question${importedQuestions.length > 1 ? 's' : ''} imported from CSV!`);

        if (errors.length > 0) {
          toast.error(`${errors.length} row(s) skipped — check console for details`);
          console.warn('CSV Import Warnings:', errors);
        }
      } catch (err) {
        console.error('CSV parse error:', err);
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-imported
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const handleSave = async (publish = false) => {
    if (!title) return toast.error('Quiz title is required');
    setSaving(true);
    try {
      let savedQuizId;
      if (isEdit) {
        await api.put(`/quizzes/${quizId}`, { title, maxTeams });
        savedQuizId = quizId;
        // Delete old questions and replace
        const oldQs = await api.get(`/questions?quizId=${quizId}`);
        await Promise.all(oldQs.data.map(q => api.delete(`/questions/${q._id}`)));
      } else {
        const res = await api.post('/quizzes', { roundId, title, maxTeams });
        savedQuizId = res.data._id;
        setJoinCode(res.data.joinCode);
      }

      // Save all questions
      for (const q of questions) {
        if (q.questionText.trim()) {
          await api.post('/questions', { quizId: savedQuizId, ...q, options: q.options.filter(o => o.trim()) });
        }
      }

      toast.success(isEdit ? 'Quiz updated!' : 'Quiz created!');
      navigate(-1);
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  const types = [
    { key: 'text', icon: 'text_fields', label: 'Text' },
    { key: 'image', icon: 'image', label: 'Image' },
    { key: 'audio', icon: 'mic', label: 'Audio' },
    { key: 'video', icon: 'videocam', label: 'Video' },
  ];

  return (
    <div className="p-8 md:p-12 max-w-5xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-on-surface tracking-tight">{isEdit ? 'Edit Quiz' : 'Create New Quiz'}</h2>
          <p className="text-on-surface-variant mt-2 text-sm">Configure your quiz settings and add questions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving} className="px-6 py-3 bg-secondary-container text-on-secondary-container rounded-xl font-medium text-sm transition-colors hover:bg-surface-container-high disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="px-6 py-3 gradient-primary text-white rounded-xl font-medium text-sm shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
            {saving ? 'Saving...' : 'Publish Quiz'}
          </button>
        </div>
      </div>

      {/* CSV Import Success Banner */}
      {csvImportCount > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-[#dcfce7] rounded-xl border border-[#86efac]">
          <span className="material-symbols-outlined text-[#15803d]">check_circle</span>
          <div>
            <span className="text-sm font-semibold text-[#15803d]">{csvImportCount} question{csvImportCount > 1 ? 's' : ''} imported from CSV</span>
            <span className="text-xs text-[#166534] ml-2">Review below before saving</span>
          </div>
          <button onClick={() => setCsvImportCount(0)} className="ml-auto p-1 text-[#15803d] hover:text-[#14532d]">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Question Builder */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center text-sm font-bold">{qIdx + 1}</span>
                  Question Configuration
                </h3>
                <button onClick={() => removeQuestion(qIdx)} className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              {/* Type Selector */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {types.map(t => (
                  <button key={t.key} onClick={() => updateQuestion(qIdx, 'type', t.key)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg transition-all ${
                      q.type === t.key ? 'bg-surface-container-low border border-primary/40 shadow-sm' : 'bg-surface-container-lowest border border-transparent hover:bg-surface-container-low'
                    }`}>
                    <span className={`material-symbols-outlined mb-1 ${q.type === t.key ? 'text-primary' : 'text-on-surface-variant'}`}>{t.icon}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${q.type === t.key ? 'text-primary' : 'text-on-surface-variant'}`}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Media Upload (if not text) */}
              {q.type !== 'text' && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-on-surface mb-2">Media File</label>
                  {q.mediaUrl ? (
                    <div className="flex flex-col gap-3 p-4 bg-surface-container-low rounded-xl border border-[#86efac]/50">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#15803d]">check_circle</span>
                        <span className="text-sm text-[#15803d] font-medium">Media uploaded successfully</span>
                        <button onClick={() => updateQuestion(qIdx, 'mediaUrl', '')} className="ml-auto text-sm text-error font-semibold hover:underline">Remove</button>
                      </div>
                      
                      {/* Media Preview Box */}
                      <div className="mt-2 flex justify-center bg-slate-950/5 p-4 rounded-lg border border-slate-100">
                        {q.type === 'image' && (
                          <img src={q.mediaUrl} alt="Question preview" className="max-h-48 object-contain rounded-lg shadow-sm border border-slate-200 bg-white" />
                        )}
                        {q.type === 'video' && (
                          <video src={q.mediaUrl} controls className="max-h-48 rounded-lg shadow-sm bg-black border border-slate-800" />
                        )}
                        {q.type === 'audio' && (
                          <audio src={q.mediaUrl} controls className="w-full max-w-md" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input type="file"
                        accept={MEDIA_ACCEPT[q.type]?.accept || ''}
                        onChange={(e) => e.target.files[0] && handleMediaUpload(qIdx, e.target.files[0])}
                        className="w-full bg-surface-container-highest rounded-lg p-3 text-sm" />
                      <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">info</span>
                        Max {MEDIA_ACCEPT[q.type]?.maxMB || 10} MB &middot; Allowed: {MEDIA_ACCEPT[q.type]?.accept || ''}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Question Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-on-surface mb-2">Question Text</label>
                <textarea value={q.questionText} onChange={(e) => updateQuestion(qIdx, 'questionText', e.target.value)}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg p-4 text-on-surface input-focus-ring resize-none h-24" placeholder="Enter your question here..." />
              </div>

              {/* MCQ Options */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-3">Answer Options</label>
                <div className="flex flex-col gap-3">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3 p-2 bg-surface-container-low rounded-lg border border-transparent hover:border-outline-variant/30 transition-all">
                      <input type="radio" name={`correct_${qIdx}`} checked={q.correctAnswerIndex === oIdx}
                        onChange={() => updateQuestion(qIdx, 'correctAnswerIndex', oIdx)}
                        className="w-5 h-5 text-primary border-outline focus:ring-primary-fixed ml-2" />
                      <input type="text" value={opt} onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-on-surface placeholder:text-on-surface-variant/50" placeholder={`Option ${oIdx + 1}`} />
                      <button onClick={() => removeOption(qIdx, oIdx)} className="p-1 text-on-surface-variant hover:text-error">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addOption(qIdx)} className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-container transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>Add Option
                </button>
              </div>

              {/* Time Limit */}
              <div className="mt-6 flex items-center gap-4">
                <label className="text-sm font-semibold text-on-surface">Time Limit:</label>
                <select value={q.timeLimit} onChange={(e) => updateQuestion(qIdx, 'timeLimit', parseInt(e.target.value))}
                  className="bg-surface-container-highest border-transparent rounded-lg px-3 py-2 text-sm text-on-surface input-focus-ring">
                  <option value={15}>15 Seconds</option>
                  <option value={30}>30 Seconds</option>
                  <option value={60}>60 Seconds</option>
                  <option value={120}>2 Minutes</option>
                </select>
              </div>
            </div>
          ))}

          {/* Add Question */}
          <button onClick={addQuestion} className="w-full py-6 border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low hover:border-primary/50 transition-all bg-surface-container-lowest">
            <span className="material-symbols-outlined text-3xl">add</span>
            <span className="font-medium">Add New Question</span>
          </button>
        </div>

        {/* Right: Settings Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quiz Details */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Quiz Details</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg p-2 text-on-surface text-sm input-focus-ring" placeholder="Quiz Title" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Max Teams</label>
                <input type="number" value={maxTeams} onChange={(e) => setMaxTeams(parseInt(e.target.value) || 50)}
                  className="w-full bg-surface-container-highest border-transparent rounded-lg p-2 text-on-surface text-sm input-focus-ring" />
              </div>
            </div>
          </div>

          {/* CSV Template Import */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-[20px]">csv</span>
              <h3 className="text-sm font-semibold text-on-surface">CSV Template</h3>
            </div>
            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Download the template, fill in your questions (text type, 2-4 options), then import it back. Questions will load into the form for review.
            </p>

            {/* Step 1: Download */}
            <button onClick={downloadCSVTemplate}
              className="w-full flex items-center gap-2 px-4 py-3 bg-surface-container-high text-on-surface rounded-lg font-medium text-sm hover:bg-surface-container-highest transition-colors justify-center mb-3 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Template
            </button>

            {/* Step 2: Import */}
            <label className="w-full flex items-center gap-2 px-4 py-3 gradient-primary text-white rounded-lg font-medium text-sm cursor-pointer hover:opacity-90 transition-opacity justify-center shadow-sm">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              Import Filled CSV
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files[0] && handleCSVImport(e.target.files[0])}
              />
            </label>

            {/* Template Info */}
            <div className="mt-4 p-3 bg-surface-container-high/50 rounded-lg">
              <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-2">Template Columns</p>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-on-surface-variant"><strong className="text-on-surface">questionText</strong> — Question text (required)</span>
                <span className="text-[11px] text-on-surface-variant"><strong className="text-on-surface">option1, option2</strong> — Required options</span>
                <span className="text-[11px] text-on-surface-variant"><strong className="text-on-surface">option3, option4</strong> — Optional</span>
                <span className="text-[11px] text-on-surface-variant"><strong className="text-on-surface">correctOption</strong> — 1, 2, 3, or 4</span>
                <span className="text-[11px] text-on-surface-variant"><strong className="text-on-surface">timeLimit</strong> — 15, 30, 60, or 120 (sec)</span>
              </div>
            </div>
          </div>

          {/* Join Code */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
            <span className="relative text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Generated Join Code</span>
            <span className="relative text-4xl font-black text-accent tracking-tight font-headline">{joinCode}</span>
            <span className="relative text-xs text-on-surface-variant mt-2 text-center">Teams will use this code to enter.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
