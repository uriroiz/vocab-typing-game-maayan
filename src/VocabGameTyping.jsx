import React, { useState, useEffect } from 'react';
import { Sparkles, Star, Award, Upload, Play, RotateCcw, Keyboard } from 'lucide-react';

const VocabGameTyping = () => {
  const [words, setWords] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);

  const sampleWords = [
    { english: 'pencil', hebrew: 'עיפרון' },
    { english: 'book', hebrew: 'ספר' },
    { english: 'teacher', hebrew: 'מורה' },
    { english: 'train', hebrew: 'רכבת' },
    { english: 'happy', hebrew: 'שמח' },
  ];

  useEffect(() => {
    // Load default word list from CSV file
    const loadDefaultWords = async () => {
      try {
        const response = await fetch('/English-Hebrew-Words-No-Duplicates.csv');
        if (response.ok) {
          const csvText = await response.text();
          const parsedWords = parseCSV(csvText);
          if (parsedWords.length > 0) {
            setWords(parsedWords);
            return;
          }
        }
      } catch (error) {
        console.log('Could not load default CSV, using sample words');
      }
      // Fallback to sample words if CSV not found
      setWords(sampleWords);
    };

    loadDefaultWords();
    
    // Load leaderboard from localStorage
    const savedLeaderboard = localStorage.getItem('vocabTypingLeaderboard');
    if (savedLeaderboard) setLeaderboard(JSON.parse(savedLeaderboard));
  }, []);

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const parsedWords = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',');
      if (parts.length >= 2) {
        parsedWords.push({ english: parts[0].trim(), hebrew: parts[1].trim() });
      }
    }
    return parsedWords;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsedWords = parseCSV(text);
      if (parsedWords.length > 0) {
        setWords(parsedWords);
        setFeedback('File loaded successfully! 🎉');
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 2000);
      }
    };
    reader.readAsText(file);
  };

  // Normalize answer for comparison (case-insensitive, trim spaces, normalize whitespace)
  const normalizeAnswer = (answer) => {
    return answer.trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // Check if user's answer matches the correct answer
  const checkAnswerMatch = (userAnswer, correctAnswer) => {
    const normalizedUser = normalizeAnswer(userAnswer);
    const normalizedCorrect = normalizeAnswer(correctAnswer);
    
    // Exact match (handles case-insensitive and normalized whitespace)
    return normalizedUser === normalizedCorrect;
  };

  const buildRounds = (wordList) => {
    const shuffled = [...wordList].sort(() => Math.random() - 0.5);
    const maxRounds = Math.min(20, shuffled.length);

    // Only Hebrew to English questions
    const rounds = shuffled.slice(0, maxRounds).map((w) => ({
      english: w.english,
      hebrew: w.hebrew,
      question: w.hebrew,
      answer: w.english,
    }));

    return rounds;
  };

  const startGame = () => {
    setGameStarted(true);
    setGameComplete(false);
    setScore(0);
    setTotalAnswered(0);
    setUserAnswer('');
    setFeedback('');
    setShowFeedback(false);
    setCelebrating(false);

    const newRounds = buildRounds(words);
    setRounds(newRounds);
    setRoundIndex(0);
  };

  const currentRound = rounds[roundIndex] || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentRound || showFeedback || !userAnswer.trim()) return;

    const correct = checkAnswerMatch(userAnswer, currentRound.answer);

    setTotalAnswered((t) => t + 1);
    setShowFeedback(true);

    if (correct) {
      setScore((s) => s + 1);
      setFeedback('🎉 Perfect! Great job!');
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1500);
    } else {
      setFeedback(`Not quite! The correct answer is: ${currentRound.answer}`);
    }

    const delay = correct ? 2500 : 4000;

    setTimeout(() => {
      setShowFeedback(false);
      setUserAnswer('');

      const isLast = roundIndex + 1 >= rounds.length;
      if (isLast) {
        endGame();
      } else {
        setRoundIndex((i) => i + 1);
        // Auto-focus input for next question
        setTimeout(() => {
          const input = document.getElementById('answer-input');
          if (input) input.focus();
        }, 100);
      }
    }, delay);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !showFeedback) {
      handleSubmit(e);
    }
  };

  const endGame = () => {
    const finalScore = score;
    const total = rounds.length || 20;
    const gameResult = {
      score: finalScore,
      total,
      percentage: Math.round((finalScore / total) * 100),
      date: new Date().toISOString(),
      timestamp: Date.now(),
    };

    const newLeaderboard = [...leaderboard, gameResult].sort((a, b) => b.score - a.score);
    setLeaderboard(newLeaderboard);
    localStorage.setItem('vocabTypingLeaderboard', JSON.stringify(newLeaderboard));

    setGameComplete(true);
    setGameStarted(false);
  };

  if (!gameStarted && !gameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <Keyboard className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-purple-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3 sm:mb-4 px-2">
            Vocabulary Typing Challenge! ⌨️
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2 sm:mb-3">
            Write the English translation of Hebrew words
          </p>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
            Type the answer in English when you see a Hebrew word
          </p>

          <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-blue-50 rounded-xl sm:rounded-2xl">
            <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-700">
              📁 Upload Your Word List (CSV)
            </h2>
            <label className="cursor-pointer inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-blue-600 transition-all transform hover:scale-105">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Choose CSV File
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">
              CSV format: English,Hebrew (one pair per line)
            </p>
          </div>

          <button
            onClick={startGame}
            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center mx-auto"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            Start Playing!
          </button>

          <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
            Using {words.length} words
          </p>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    const latestGame = leaderboard[leaderboard.length - 1];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 max-w-2xl w-full">
          <div className="text-center mb-6 sm:mb-8">
            <Award className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-yellow-500 mx-auto mb-3 sm:mb-4" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Game Complete!</h1>
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-purple-600 mb-2">{score} / {rounds.length || 20}</p>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-700">{latestGame?.percentage}%</p>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">🏆 Typing Challenge Leaderboard</h2>
            <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-96 overflow-y-auto">
              {leaderboard.map((game, index) => {
                const isLatest = index === leaderboard.length - 1;
                const date = new Date(game.date);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={game.timestamp}
                    className={`p-3 sm:p-4 rounded-lg sm:rounded-xl flex justify-between items-center ${
                      isLatest
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-600">#{leaderboard.length - index}</div>
                      <div>
                        <div className="text-sm sm:text-base font-semibold text-gray-800">
                          {game.score} / {game.total} ({game.percentage}%)
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600">{dateStr}</div>
                      </div>
                    </div>
                    {isLatest && (
                      <div className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold">
                        Latest
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold rounded-xl sm:rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center"
          >
            <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            Play Again!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 p-2 sm:p-3 md:p-4">
      <div className="max-w-4xl mx-auto mb-3 sm:mb-4 md:mb-6">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-2 sm:p-3 md:p-4 flex flex-wrap justify-between items-center gap-2 sm:gap-4">
          <div className="flex items-center flex-wrap gap-2 sm:gap-4 md:gap-6">
            <div className="flex items-center">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-500 mr-1 sm:mr-2" />
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{score}</span>
              <span className="text-sm sm:text-base md:text-lg text-gray-600 ml-1 sm:ml-2">/ {totalAnswered}</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg font-semibold text-purple-600">
              Q{totalAnswered + 1}/{rounds.length}
            </div>
            <div className="text-sm sm:text-base md:text-lg text-gray-600">
              {totalAnswered > 0 ? `${Math.round((score / totalAnswered) * 100)}%` : '0%'}
            </div>
          </div>
          <button
            onClick={startGame}
            className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-purple-500 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl hover:bg-purple-600 transition-all"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Restart</span>
            <span className="sm:hidden">↻</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className={`bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 transform transition-all duration-300 ${celebrating ? 'scale-105' : 'scale-100'}`}>
          {currentRound && (
            <>
              <div className="text-center mb-6 sm:mb-8 md:mb-10">
                <div className="inline-block px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                  Hebrew → English
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-4 sm:mb-6 min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex items-center justify-center px-2 break-words" dir="rtl">
                  {currentRound.question}
                </h2>

                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8">
                  Type the English translation:
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="relative">
                  <input
                    id="answer-input"
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    disabled={showFeedback}
                    placeholder="Type your answer in English..."
                    autoFocus
                    autoComplete="off"
                    className={`w-full px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-center rounded-xl sm:rounded-2xl border-4 transition-all ${
                      showFeedback
                        ? userAnswer.trim().toLowerCase() === currentRound.answer.toLowerCase()
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : 'bg-red-100 border-red-500 text-red-700'
                        : inputFocused
                        ? 'bg-purple-50 border-purple-400 text-gray-800'
                        : 'bg-gray-50 border-purple-300 text-gray-800'
                    } focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                      showFeedback ? 'cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={showFeedback || !userAnswer.trim()}
                  className={`w-full px-6 sm:px-8 py-4 sm:py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg sm:text-xl md:text-2xl font-bold rounded-xl sm:rounded-2xl transition-all shadow-lg ${
                    showFeedback || !userAnswer.trim()
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 active:scale-95'
                  }`}
                >
                  Submit Answer
                </button>
              </form>

              {showFeedback && (
                <div
                  className={`mt-4 sm:mt-6 p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-center text-base sm:text-lg md:text-xl font-bold ${
                    userAnswer.trim().toLowerCase() === currentRound.answer.toLowerCase()
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {feedback}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {celebrating && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Star
              key={i}
              className="absolute text-yellow-400 animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VocabGameTyping;

