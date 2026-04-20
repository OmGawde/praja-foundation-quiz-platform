const Competition = require('../models/Competition');
const Round = require('../models/Round');
const Quiz = require('../models/Quiz');
const Team = require('../models/Team');
const Answer = require('../models/Answer');
const Question = require('../models/Question');

/**
 * Generate CSV content as a string
 */
const generateCSV = (headers, rows) => {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map(row => row.map(escape).join(','));
  return [headerLine, ...dataLines].join('\n');
};

/**
 * Competition-level CSV: All rounds, quizzes, teams, overall performance
 */
const generateCompetitionCSV = async (competitionId) => {
  const competition = await Competition.findById(competitionId);
  if (!competition) throw new Error('Competition not found');

  const rounds = await Round.find({ competitionId }).sort({ order: 1 });
  const headers = [
    'Round Name', 'Round Order', 'Quiz Title', 'Quiz Status', 'Join Code',
    'Team Name', 'Participant 1', 'Participant 2', 'Institute', 'Email',
    'Score', 'Correct Answers', 'Incorrect Answers', 'Unattempted',
    'Total Response Time (ms)', 'Avg Response Time (ms)'
  ];

  const rows = [];
  for (const round of rounds) {
    const quizzes = await Quiz.find({ roundId: round._id });
    for (const quiz of quizzes) {
      const teams = await Team.find({ quizId: quiz._id })
        .sort({ correctAnswers: -1, totalResponseTime: 1 });
      for (const team of teams) {
        const answerCount = await Answer.countDocuments({ teamId: team._id, quizId: quiz._id });
        const avgTime = answerCount > 0 ? Math.round(team.totalResponseTime / answerCount) : 0;
        rows.push([
          round.name, round.order, quiz.title, quiz.status, quiz.joinCode,
          team.teamName, team.participant1, team.participant2, team.institute, team.email,
          team.score, team.correctAnswers, team.incorrectAnswers, team.unattempted,
          team.totalResponseTime, avgTime
        ]);
      }
    }
  }

  return generateCSV(headers, rows);
};

/**
 * Round-level CSV: All quizzes in the round, all teams, round performance
 */
const generateRoundCSV = async (roundId) => {
  const round = await Round.findById(roundId).populate('competitionId', 'name');
  if (!round) throw new Error('Round not found');

  const headers = [
    'Competition', 'Round Name', 'Quiz Title', 'Quiz Status', 'Join Code',
    'Team Name', 'Participant 1', 'Participant 2', 'Institute', 'Email',
    'Score', 'Correct Answers', 'Incorrect Answers', 'Unattempted',
    'Total Response Time (ms)', 'Avg Response Time (ms)'
  ];

  const quizzes = await Quiz.find({ roundId }).sort({ createdAt: 1 });
  const rows = [];

  for (const quiz of quizzes) {
    const teams = await Team.find({ quizId: quiz._id })
      .sort({ correctAnswers: -1, totalResponseTime: 1 });
    for (const team of teams) {
      const answerCount = await Answer.countDocuments({ teamId: team._id, quizId: quiz._id });
      const avgTime = answerCount > 0 ? Math.round(team.totalResponseTime / answerCount) : 0;
      rows.push([
        round.competitionId?.name || '', round.name, quiz.title, quiz.status, quiz.joinCode,
        team.teamName, team.participant1, team.participant2, team.institute, team.email,
        team.score, team.correctAnswers, team.incorrectAnswers, team.unattempted,
        team.totalResponseTime, avgTime
      ]);
    }
  }

  return generateCSV(headers, rows);
};

/**
 * Quiz-level CSV: Teams, scores, correct/incorrect/unattempted, response times
 */
const generateQuizCSV = async (quizId) => {
  const quiz = await Quiz.findById(quizId).populate({
    path: 'roundId',
    populate: { path: 'competitionId', select: 'name' }
  });
  if (!quiz) throw new Error('Quiz not found');

  const questions = await Question.find({ quizId }).sort({ order: 1 });
  const teams = await Team.find({ quizId })
    .sort({ correctAnswers: -1, totalResponseTime: 1 });

  // Build headers: base + per-question columns
  const headers = [
    'Rank', 'Team Name', 'Participant 1', 'Participant 2', 'Institute', 'Email',
    'Score', 'Correct', 'Incorrect', 'Unattempted', 'Total Time (ms)', 'Avg Time (ms)'
  ];
  questions.forEach((q, i) => {
    headers.push(`Q${i + 1} Answer`);
    headers.push(`Q${i + 1} Correct?`);
    headers.push(`Q${i + 1} Time (ms)`);
  });

  const rows = [];
  for (let rank = 0; rank < teams.length; rank++) {
    const team = teams[rank];
    const answers = await Answer.find({ teamId: team._id, quizId });
    const answerMap = {};
    answers.forEach(a => { answerMap[a.questionId.toString()] = a; });

    const answerCount = answers.length;
    const avgTime = answerCount > 0 ? Math.round(team.totalResponseTime / answerCount) : 0;

    const row = [
      rank + 1, team.teamName, team.participant1, team.participant2,
      team.institute, team.email,
      team.score, team.correctAnswers, team.incorrectAnswers, team.unattempted,
      team.totalResponseTime, avgTime
    ];

    questions.forEach(q => {
      const ans = answerMap[q._id.toString()];
      if (ans) {
        row.push(q.options[ans.selectedOption] || ans.selectedOption);
        row.push(ans.isCorrect ? 'Yes' : 'No');
        row.push(ans.responseTime);
      } else {
        row.push('N/A');
        row.push('N/A');
        row.push('N/A');
      }
    });

    rows.push(row);
  }

  return generateCSV(headers, rows);
};

module.exports = { generateCompetitionCSV, generateRoundCSV, generateQuizCSV };
