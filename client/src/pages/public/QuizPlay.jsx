import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

export default function QuizPlay() {
  const { quizId, teamId } = useParams();
  const socket = useSocket();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [previousAnswer, setPreviousAnswer] = useState(null);
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && socket) {
        socket.emit('tabSwitch', { quizId, teamId });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [socket, quizId, teamId]);

  useEffect(() => {
    if (!socket) return;

    // Join the quiz room and request current question (fixes race condition)
    console.log('QuizPlay component mounted, requesting current question...');
    socket.emit('joinQuiz', { quizId, teamId });
    socket.emit('requestCurrentQuestion', { quizId, teamId });

    // When server sends the current question (on rejoin)
    socket.on('currentQuestion', (data) => {
      console.log('Received currentQuestion payload:', data);
      if (data.question) {
        setQuestion(data.question);
        setTimeLeft(Math.max(0, data.remainingTime || data.question.timeLimit));
        setSelected(null);
        setSubmitted(false);
        setFeedback(null);
      } else if (data.status === 'ended') {
        navigate(`/results/${quizId}/${teamId}`);
      } else if (data.status === 'lobby') {
        // Technically shouldn't happen if navigate works, but just in case
        console.log('Quiz still in lobby');
      }
    });

    socket.on('quizStarted', (data) => {
      console.log('Quiz started event fired:', data);
      // Now that the quiz is live, fetch this specific team's customized Question 1 from the server
      socket.emit('requestCurrentQuestion', { quizId, teamId });
    });

    socket.on('nextQuestion', (data) => {
      setPreviousAnswer(data.previousAnswer);
      setQuestion(data.question);
      setTimeLeft(data.question.timeLimit);
      setSelected(null);
      setSubmitted(false);
      setFeedback(null);
    });

    socket.on('answerReceived', (data) => {
      setFeedback(data);
    });

    socket.on('quizEnded', (data) => {
      navigate(`/results/${quizId}/${teamId}`);
    });

    return () => {
      socket.off('currentQuestion');
      socket.off('quizStarted');
      socket.off('nextQuestion');
      socket.off('answerReceived');
      socket.off('quizEnded');
    };
  }, [socket, quizId, teamId, navigate]);

  // Client-side countdown (visual only, server controls actual timer)
  useEffect(() => {
    if (timeLeft <= 0 && !submitted && question) {
      fetchNext();
      return;
    }
    if (timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, question, fetchNext]);

  const handleSubmit = useCallback(() => {
    if (selected === null || submitted || !socket) return;
    socket.emit('submitAnswer', { quizId, teamId, questionId: question._id, selectedOption: selected });
    setSubmitted(true);
  }, [selected, submitted, socket, quizId, teamId, question]);

  const fetchNext = useCallback(() => {
    if (!socket) return;
    socket.emit('fetchNextQuestion', { quizId, teamId });
  }, [socket, quizId, teamId]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const progress = question ? ((question.questionNumber) / question.totalQuestions) * 100 : 0;

  if (!question) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-primary text-6xl animate-pulse">hourglass_empty</span>
          <p className="text-xl font-bold text-on-surface mt-4">Waiting for quiz to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body antialiased">
      {/* Header */}
      <header className="w-full bg-surface/90 backdrop-blur-md sticky top-0 z-50 pt-6 pb-4 px-6 md:px-12 flex flex-col gap-4">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant font-label">
              Question {question.questionNumber} of {question.totalQuestions}
            </span>
            <div className="flex gap-1 items-center">
              <span className="text-xl font-extrabold tracking-tight text-on-surface">Quiz in Progress</span>
              <span className="px-2 py-0.5 ml-3 bg-[#dcfce7] text-[#15803d] text-xs font-bold rounded-full uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>Live
              </span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ghost-border ${timeLeft <= 5 ? 'bg-error-container' : 'bg-surface-container-highest'}`}>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            <span className={`text-2xl font-bold font-headline tracking-tighter w-[72px] text-right ${timeLeft <= 5 ? 'text-error' : 'text-on-surface'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 sm:px-6 md:px-12 py-8 md:py-12">
        <div className="max-w-5xl w-full flex flex-col gap-8 md:gap-12">
          {/* Previous Answer Alert */}
          {previousAnswer && (
            <div className="bg-surface-container-low border border-outline-variant/30 text-on-surface-variant p-4 rounded-xl ambient-shadow flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <p className="flex-grow">The correct answer for the previous question was: <strong className="text-on-surface font-black px-2">{previousAnswer.correctAnswerText}</strong></p>
              <button 
                onClick={() => setPreviousAnswer(null)}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          )}

          {/* Question Card */}
          <article className="bg-surface-container-lowest rounded-xl p-6 md:p-10 ambient-shadow flex flex-col gap-8 w-full">
            {question.mediaUrl && (
              <div className="w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden bg-surface-container-high relative flex items-center justify-center">
                {question.type === 'image' && <img src={question.mediaUrl} alt="Question media" className="w-full h-full object-contain" />}
                {question.type === 'audio' && <audio controls src={question.mediaUrl} className="w-full" />}
                {question.type === 'video' && <video controls src={question.mediaUrl} className="w-full h-full object-contain" />}
              </div>
            )}
            <div className="max-w-4xl">
              <h1 className="text-2xl md:text-4xl font-semibold text-on-surface font-headline leading-tight tracking-tight">
                {question.questionText}
              </h1>
            </div>
          </article>

          {/* Options Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            {question.options.map((optionObj, idx) => {
              const isSelected = selected === optionObj.originalIndex;
              return (
                <button
                  key={optionObj.originalIndex}
                  onClick={() => { if (!submitted) setSelected(optionObj.originalIndex); }}
                  disabled={submitted}
                  className={`group relative w-full text-left p-6 md:p-8 rounded-xl transition-all duration-200 flex items-start gap-4 outline-none ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container ambient-shadow border-2 border-primary-container'
                      : 'bg-surface-container-highest hover:bg-surface-container-high ghost-border focus:ring-4 focus:ring-primary/20'
                  } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isSelected
                      ? 'bg-on-primary-container text-primary-container'
                      : 'bg-surface-container-low text-on-surface-variant group-hover:bg-surface group-hover:text-primary'
                  } transition-colors`}>
                    {optionLabels[idx]}
                  </span>
                  <span className={`text-lg md:text-xl font-medium leading-snug ${
                    isSelected ? 'font-semibold' : 'text-on-surface-variant group-hover:text-on-surface'
                  } transition-colors`}>
                    {optionObj.text}
                  </span>
                  {isSelected && (
                    <span className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 right-6 md:right-8" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  )}
                </button>
              );
            })}
          </section>

          {/* Submit / Next */}
          <div className="w-full flex justify-between items-center pt-4 flex-wrap gap-4">
            {feedback && (
              <div className={`text-sm font-medium px-4 py-2 rounded-lg ${feedback.status === 'accepted' ? (feedback.isCorrect ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-error-container text-error') : 'bg-surface-container-high text-on-surface-variant'}`}>
                {feedback.status === 'accepted' ? (feedback.isCorrect ? '✅ Answer recorded!' : '❌ Answer recorded') : feedback.message}
              </div>
            )}
            
            <div className="flex gap-4 ml-auto">
              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null || submitted}
                  className="gradient-primary text-white px-8 py-4 rounded-xl font-bold text-lg tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                  <span className="material-symbols-outlined">send</span>
                </button>
              ) : (
                <button
                  onClick={fetchNext}
                  className="bg-primary-container text-on-primary-container px-8 py-4 rounded-xl font-bold text-lg tracking-wide hover:opacity-90 transition-all duration-200 flex items-center gap-2"
                >
                  Next Question
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
