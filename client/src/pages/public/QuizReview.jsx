import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function QuizReview() {
  const { quizId, teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/teams/${teamId}`)
      .then(res => {
        setTeam(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [teamId]);

  if (loading) {
     return <div className="min-h-screen bg-surface flex items-center justify-center p-8"><p className="text-xl font-bold">Loading...</p></div>;
  }

  if (!team || !team.answers) {
    return <div className="min-h-screen bg-surface flex items-center justify-center p-8"><p className="text-xl font-bold text-error">Could not load review data.</p></div>;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen p-8 md:p-12 font-body">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2">Answer Review</h1>
            <p className="text-on-surface-variant font-medium">Team: {team.teamName}</p>
          </div>
          <Link to={`/results/${quizId}/${teamId}`} className="px-4 py-2 bg-surface-container-high hover:bg-surface-dim transition-colors rounded-lg font-bold text-sm tracking-wide">
            Back to Results
          </Link>
        </div>

        {/* Answers List */}
        <div className="flex flex-col gap-6">
          {team.answers.map((ans, idx) => {
            const q = ans.questionId;
            if (!q) return null;
            return (
              <div key={ans._id} className={`p-6 rounded-xl border-l-[6px] ambient-shadow bg-surface-container-lowest ${ans.isCorrect ? 'border-[#15803d]' : 'border-error'}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold font-headline">Question {idx + 1}</h3>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${ans.isCorrect ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-error-container text-error'}`}>
                    {ans.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                <p className="text-on-surface mb-6 text-lg">{q.questionText}</p>
                <div className="flex flex-col gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = ans.selectedOption === oIdx;
                    const isActuallyCorrect = q.correctAnswerIndex === oIdx;
                    
                    let bgClass = "bg-surface-container-high text-on-surface border-transparent";
                    if (isActuallyCorrect) bgClass = "bg-[#dcfce7] text-[#15803d] border-[#15803d]/30 font-bold";
                    else if (isSelected && !isActuallyCorrect) bgClass = "bg-error-container text-error border-error/30 font-bold";

                    return (
                      <div key={oIdx} className={`p-4 rounded-lg flex items-center justify-between border ${bgClass}`}>
                        <span>{opt}</span>
                        {isActuallyCorrect && <span className="material-symbols-outlined text-[20px]">check_circle</span>}
                        {isSelected && !isActuallyCorrect && <span className="material-symbols-outlined text-[20px]">cancel</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {team.answers.length === 0 && (
             <div className="text-center p-8 text-on-surface-variant bg-surface-container-lowest rounded-xl">No answers found for this team.</div>
          )}
        </div>
      </div>
    </div>
  );
}
