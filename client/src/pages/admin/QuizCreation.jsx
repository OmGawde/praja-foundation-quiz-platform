import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function QuizCreation() {
  const { roundId, quizId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!quizId;

  const [title, setTitle] = useState('');
  const [maxTeams, setMaxTeams] = useState(50);
  const [joinCode, setJoinCode] = useState('—');
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [saving, setSaving] = useState(false);

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

  const handleMediaUpload = async (qIdx, file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload/media', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateQuestion(qIdx, 'mediaUrl', res.data.url);
      toast.success('Media uploaded');
    } catch (err) { toast.error('Upload failed'); }
  };

  const handleExcelUpload = async (file, savedQuizId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('quizId', savedQuizId);
    try {
      const res = await api.post('/questions/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message);
    } catch (err) { toast.error('Excel upload failed'); }
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
      {/* Header — Stitch Design 11 */}
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
                    <div className="flex items-center gap-3 p-3 bg-[#dcfce7] rounded-lg">
                      <span className="material-symbols-outlined text-[#15803d]">check_circle</span>
                      <span className="text-sm text-[#15803d] font-medium">Media uploaded</span>
                      <button onClick={() => updateQuestion(qIdx, 'mediaUrl', '')} className="ml-auto text-sm text-error">Remove</button>
                    </div>
                  ) : (
                    <input type="file" onChange={(e) => e.target.files[0] && handleMediaUpload(qIdx, e.target.files[0])}
                      className="w-full bg-surface-container-highest rounded-lg p-3 text-sm" />
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

          {/* Excel Upload */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm ghost-border">
            <h3 className="text-sm font-semibold text-on-surface mb-4">Bulk Upload</h3>
            <p className="text-xs text-on-surface-variant mb-4">Upload an Excel file with columns: questionText, option1, option2, option3, option4, correctAnswer, timeLimit</p>
            <label className="flex items-center gap-2 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium text-sm cursor-pointer hover:bg-opacity-80 transition-colors justify-center">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>Upload Excel
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
                if (isEdit && quizId) { await handleExcelUpload(e.target.files[0], quizId); window.location.reload(); }
                else toast.error('Save quiz first before bulk upload');
              }} />
            </label>
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
