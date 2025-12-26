import React, { useState } from 'react';
import { HelpCircle, FileText, LogOut, CheckSquare, X, ChevronDown, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateMCQ, generateSubjectiveTest, submitEvaluation, submitSubjectiveTest, generateNotes } from '../../api';

const QuizView = ({ projectId, availableTopics, selectedDocuments }) => {
    const [quizMode, setQuizMode] = useState('mcq'); // 'mcq' | 'subjective'

    // MCQ State
    const [mcqTopic, setMcqTopic] = useState('');
    const [mcqTopicSelection, setMcqTopicSelection] = useState('');
    const [mcqNumQuestions, setMcqNumQuestions] = useState(5);
    const [mcqTest, setMcqTest] = useState(null);
    const [mcqLoading, setMcqLoading] = useState(false);
    const [mcqUserAnswers, setMcqUserAnswers] = useState({});
    const [mcqSubmitted, setMcqSubmitted] = useState(false);
    const [mcqScore, setMcqScore] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Eval (Subjective) State
    const [evalTopic, setEvalTopic] = useState('');
    const [evalTopicSelection, setEvalTopicSelection] = useState('');
    const [evalNumQuestions, setEvalNumQuestions] = useState(3);
    const [evalTest, setEvalTest] = useState(null);
    const [evalUserAnswers, setEvalUserAnswers] = useState({});
    const [evalResult, setEvalResult] = useState(null);
    const [evalLoading, setEvalLoading] = useState(false);

    // MCQ Handlers
    const handleGenerateMCQ = async () => {
        setMcqLoading(true);
        setMcqTest(null);
        setMcqScore(null);
        setMcqUserAnswers({});
        setMcqSubmitted(false);
        setCurrentQuestionIndex(0);

        try {
            const data = await generateMCQ(projectId, mcqTopic, mcqNumQuestions, selectedDocuments);
            setMcqTest(data);
        } catch (error) {
            console.error("MCQ gen error", error);
            alert("Failed to generate MCQ");
        } finally {
            setMcqLoading(false);
        }
    };

    const handleOptionSelect = (qIndex, option) => {
        if (mcqSubmitted) return;
        setMcqUserAnswers(prev => ({ ...prev, [qIndex]: option }));
    };

    const handleSubmitMCQ = () => {
        let score = 0;
        mcqTest.questions.forEach((q, i) => {
            if (mcqUserAnswers[i] === q.correct_answer) score++;
        });
        setMcqScore({
            score,
            total: mcqTest.questions.length,
            percentage: (score / mcqTest.questions.length) * 100
        });
        setMcqSubmitted(true);
    };

    const handleRetest = () => {
        setMcqUserAnswers({});
        setMcqSubmitted(false);
        setMcqScore(null);
        setCurrentQuestionIndex(0);
    };

    const handleClearMCQ = () => {
        setMcqTest(null);
        setMcqTopic('');
        setMcqTopicSelection('');
        setMcqNumQuestions(5);
        setMcqUserAnswers({});
        setMcqSubmitted(false);
        setMcqScore(null);
        setCurrentQuestionIndex(0);
    };

    // Subjective Handlers
    const handleGenerateSubjectiveTest = async () => {
        setEvalLoading(true);
        setEvalTest(null);
        setEvalResult(null);
        setEvalUserAnswers({});

        if (selectedDocuments.length === 0) {
            alert("Please select at least one document to generate a subjective test.");
            setEvalLoading(false);
            return;
        }

        try {
            const data = await generateSubjectiveTest(projectId, evalTopic, evalNumQuestions, selectedDocuments);
            setEvalTest(data);
        } catch (error) {
            console.error("Subjective test gen error", error);
            alert("Failed to generate subjective test");
        } finally {
            setEvalLoading(false);
        }
    };

    const handleSubjectiveAnswerChange = (qId, text) => {
        setEvalUserAnswers(prev => ({ ...prev, [qId]: text }));
    };

    const handleSubmitSubjectiveTest = async () => {
        setEvalLoading(true);
        try {
            // Transform answers to format expected by backend: Dict[int, str]
            // API expects: { 1: "answer1", 2: "answer2" }
            const answersPayload = {};
            Object.keys(evalUserAnswers).forEach(qId => {
                answersPayload[parseInt(qId)] = evalUserAnswers[qId];
            });

            const data = await submitSubjectiveTest(evalTest.test_id, answersPayload);
            setEvalResult(data);
        } catch (error) {
            console.error("Submit subjective error", error);
            alert("Failed to submit answers");
        } finally {
            setEvalLoading(false);
        }
    };

    const handleResetSubjectiveTest = () => {
        setEvalTest(null);
        setEvalTopic('');
        setEvalTopicSelection('');
        setEvalNumQuestions(3);
        setEvalUserAnswers({});
        setEvalResult(null);
    };


    return (
        <div className="h-full flex flex-col relative w-full">
            <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto pb-24 custom-scrollbar p-2 md:p-8">

                {/* MCQ VIEW */}
                {quizMode === 'mcq' && (
                    <>
                        {!mcqTest ? (
                            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4">
                                <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-[#E6D5CC] mb-6">
                                    <HelpCircle className="h-8 w-8 text-[#C8A288]" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-[#4A3B32]">Generate Quiz</h3>
                                <p className="text-[#8a6a5c] mb-8">Create a personalized multiple-choice quiz from your documents.</p>

                                <div className="max-w-md mx-auto space-y-5 bg-white p-6 md:p-8 rounded-3xl border border-[#E6D5CC] shadow-sm text-left">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-[#4A3B32] uppercase tracking-wide opacity-80">Topic</label>
                                        {availableTopics.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    value={mcqTopicSelection}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setMcqTopicSelection(val);
                                                        if (val !== '__custom__') setMcqTopic(val);
                                                        else setMcqTopic('');
                                                    }}
                                                    className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] text-[#4A3B32] font-medium appearance-none"
                                                >
                                                    <option value="">Select a topic...</option>
                                                    {availableTopics.map((topic, idx) => (
                                                        <option key={idx} value={topic}>{topic}</option>
                                                    ))}
                                                    <option value="__custom__">Custom Topic...</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a6a5c] pointer-events-none" />
                                                {mcqTopicSelection === '__custom__' && (
                                                    <input
                                                        type="text"
                                                        value={mcqTopic}
                                                        onChange={(e) => setMcqTopic(e.target.value)}
                                                        placeholder="Enter custom topic..."
                                                        className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] mt-3 animate-in fade-in"
                                                        autoFocus
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={mcqTopic}
                                                onChange={(e) => setMcqTopic(e.target.value)}
                                                placeholder="e.g., Thermodynamics"
                                                className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288]"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-[#4A3B32] uppercase tracking-wide opacity-80">Questions</label>
                                        <div className="relative">
                                            <select
                                                value={mcqNumQuestions}
                                                onChange={(e) => setMcqNumQuestions(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] text-[#4A3B32] font-medium appearance-none"
                                            >
                                                {[3, 5, 10, 15, 20].map(num => (
                                                    <option key={num} value={num}>{num} Questions</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a6a5c] pointer-events-none" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerateMCQ}
                                        disabled={mcqLoading}
                                        className="w-full py-4 bg-[#C8A288] text-white rounded-xl hover:bg-[#B08B72] font-bold shadow-lg shadow-[#C8A288]/20 disabled:opacity-50 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                                    >
                                        {mcqLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckSquare className="h-5 w-5" />}
                                        {mcqLoading ? 'Generating...' : 'Start Quiz'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="pb-20 h-full flex flex-col">
                                {/* Quiz Header */}
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#4A3B32]">{mcqTest.topic || 'General'} Quiz</h3>
                                        <p className="text-xs text-[#8a6a5c] font-bold uppercase tracking-wider mt-1">
                                            Question {currentQuestionIndex + 1} of {mcqTest.questions.length}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClearMCQ}
                                        className="p-2 hover:bg-[#E6D5CC]/30 rounded-lg text-[#8a6a5c] transition-colors"
                                        title="Exit Quiz"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full bg-[#E6D5CC]/30 rounded-full mb-8 overflow-hidden mx-2">
                                    <div
                                        className="h-full bg-[#C8A288] transition-all duration-500 ease-out rounded-full"
                                        style={{ width: `${((currentQuestionIndex + 1) / mcqTest.questions.length) * 100}%` }}
                                    />
                                </div>

                                {mcqScore ? (
                                    /* Result View */
                                    <div className="animate-in fade-in zoom-in-95 duration-300 px-2">
                                        <div className="bg-white p-8 rounded-3xl border border-[#E6D5CC] shadow-lg text-center mb-8 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C8A288] to-[#FDF6F0]" />
                                            <h4 className="text-2xl font-bold text-[#4A3B32] mb-2">Quiz Complete!</h4>
                                            <div className="relative inline-block my-6">
                                                <div className="h-32 w-32 rounded-full border-8 border-[#FDF6F0] flex items-center justify-center">
                                                    <span className="text-4xl font-black text-[#C8A288]">{Math.round(mcqScore.percentage)}%</span>
                                                </div>
                                            </div>
                                            <p className="text-[#8a6a5c] mb-8 font-medium">You got {mcqScore.score} out of {mcqScore.total} questions correct.</p>

                                            <div className="flex justify-center gap-4">
                                                <button
                                                    onClick={handleRetest}
                                                    className="px-8 py-3 bg-[#FDF6F0] text-[#4A3B32] rounded-xl hover:bg-[#E6D5CC] font-bold transition-colors border border-transparent hover:border-[#C8A288]"
                                                >
                                                    Retest
                                                </button>
                                                <button
                                                    onClick={handleClearMCQ}
                                                    className="px-8 py-3 bg-[#C8A288] text-white rounded-xl hover:bg-[#B08B72] font-bold transition-colors shadow-lg shadow-[#C8A288]/20"
                                                >
                                                    New Quiz
                                                </button>
                                            </div>
                                        </div>

                                        {/* Scrollable Review List */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-[#4A3B32] px-2 mb-2">Review Answers</h4>
                                            {mcqTest.questions.map((q, i) => {
                                                const isCorrect = mcqUserAnswers[i] === q.correct_answer;
                                                const userAnswerOption = q.options.find(opt => opt.option === mcqUserAnswers[i]);
                                                const correctAnswerOption = q.options.find(opt => opt.option === q.correct_answer);

                                                return (
                                                    <div key={i} className={`p-5 rounded-xl border ${isCorrect
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-red-50 border-red-200'
                                                        }`}>
                                                        {/* Question Header */}
                                                        <div className="flex gap-2 mb-3">
                                                            <span className="font-bold text-xs opacity-50 mt-1">Q{i + 1}</span>
                                                            <div className="text-sm font-medium flex-1">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question}</ReactMarkdown>
                                                            </div>
                                                            {isCorrect
                                                                ? <CheckSquare className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                                : <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                            }
                                                        </div>

                                                        {/* Answers Section */}
                                                        <div className="ml-6 space-y-2 text-sm">
                                                            {/* User's Answer */}
                                                            <div className={`flex items-start gap-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                                                                <span className="font-semibold min-w-[100px]">Your Answer:</span>
                                                                <span>
                                                                    <span className="font-bold">{mcqUserAnswers[i] || '—'}</span>
                                                                    {userAnswerOption && <span className="ml-1">- {userAnswerOption.text}</span>}
                                                                </span>
                                                            </div>

                                                            {/* Correct Answer (show only if user got it wrong) */}
                                                            {!isCorrect && (
                                                                <div className="flex items-start gap-2 text-green-700">
                                                                    <span className="font-semibold min-w-[100px]">Correct Answer:</span>
                                                                    <span>
                                                                        <span className="font-bold">{q.correct_answer}</span>
                                                                        {correctAnswerOption && <span className="ml-1">- {correctAnswerOption.text}</span>}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Explanation */}
                                                            {q.explanation && (
                                                                <div className="mt-3 p-3 bg-white/60 rounded-lg border border-[#E6D5CC]/50">
                                                                    <span className="font-semibold text-[#4A3B32] block mb-1">💡 Explanation:</span>
                                                                    <div className="text-[#5a4a42] prose prose-sm max-w-none">
                                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.explanation}</ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* Active Question View */
                                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 px-2" key={currentQuestionIndex}>
                                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E6D5CC] shadow-sm mb-6 flex-1 md:flex-none">
                                            <div className="prose prose-lg max-w-none text-[#4A3B32] font-medium mb-6">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {mcqTest.questions[currentQuestionIndex].question}
                                                </ReactMarkdown>
                                            </div>

                                            <div className="space-y-3">
                                                {mcqTest.questions[currentQuestionIndex].options.map((opt, idx) => {
                                                    const isSelected = mcqUserAnswers[currentQuestionIndex] === opt.option;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleOptionSelect(currentQuestionIndex, opt.option)}
                                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 group ${isSelected
                                                                ? 'bg-[#FDF6F0] border-[#C8A288] shadow-sm'
                                                                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                                                }`}
                                                        >
                                                            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${isSelected
                                                                ? 'bg-[#C8A288] border-[#C8A288] text-white'
                                                                : 'bg-white border-[#E6D5CC] text-[#8a6a5c] group-hover:border-[#C8A288]'
                                                                }`}>
                                                                {opt.option}
                                                            </div>
                                                            <span className={`text-[#4A3B32] font-medium ${isSelected ? 'opacity-100' : 'opacity-80'}`}>
                                                                {opt.text}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mt-auto md:mt-0 pb-4 md:pb-0">
                                            <button
                                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                                disabled={currentQuestionIndex === 0}
                                                className="px-6 py-3 rounded-xl font-bold text-[#8a6a5c] disabled:opacity-30 hover:bg-[#FDF6F0] transition-colors"
                                            >
                                                Previous
                                            </button>

                                            {currentQuestionIndex === mcqTest.questions.length - 1 ? (
                                                <button
                                                    onClick={handleSubmitMCQ}
                                                    disabled={Object.keys(mcqUserAnswers).length !== mcqTest.questions.length}
                                                    className="px-8 py-3 bg-[#C8A288] text-white rounded-xl font-bold shadow-lg shadow-[#C8A288]/20 hover:bg-[#B08B72] transition-colors disabled:opacity-50 disabled:shadow-none"
                                                >
                                                    Submit Quiz
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(mcqTest.questions.length - 1, prev + 1))}
                                                    className="px-8 py-3 bg-[#4A3B32] text-white rounded-xl font-bold hover:bg-[#2e2520] transition-colors flex items-center gap-2"
                                                >
                                                    Next <ChevronDown className="h-4 w-4 -rotate-90" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* SUBJECTIVE VIEW */}
                {quizMode === 'subjective' && (
                    <>
                        {!evalTest ? (
                            <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4">
                                <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-[#E6D5CC] mb-6">
                                    <FileText className="h-8 w-8 text-[#C8A288]" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2 text-[#4A3B32]">Subjective Evaluation</h3>
                                <p className="text-[#8a6a5c] mb-8">Write answers and get AI feedback.</p>

                                <div className="max-w-md mx-auto space-y-4 bg-white p-6 md:p-8 rounded-3xl border border-[#E6D5CC] shadow-sm text-left">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-[#4A3B32] uppercase tracking-wide opacity-80">Topic</label>

                                        {availableTopics.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    value={evalTopicSelection}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEvalTopicSelection(val);
                                                        if (val !== '__custom__') setEvalTopic(val);
                                                        else setEvalTopic('');
                                                    }}
                                                    className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] text-[#4A3B32] font-medium appearance-none"
                                                >
                                                    <option value="">Select a topic...</option>
                                                    {availableTopics.map((topic, idx) => (
                                                        <option key={idx} value={topic}>{topic}</option>
                                                    ))}
                                                    <option value="__custom__">Custom Topic...</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a6a5c] pointer-events-none" />
                                                {evalTopicSelection === '__custom__' && (
                                                    <input
                                                        type="text"
                                                        value={evalTopic}
                                                        onChange={(e) => setEvalTopic(e.target.value)}
                                                        placeholder="Enter custom topic..."
                                                        className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] mt-3"
                                                        autoFocus
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                value={evalTopic}
                                                onChange={(e) => setEvalTopic(e.target.value)}
                                                placeholder="e.g., Photosynthesis"
                                                className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288]"
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-[#4A3B32] uppercase tracking-wide opacity-80">Questions</label>
                                        <div className="relative">
                                            <select
                                                value={evalNumQuestions}
                                                onChange={(e) => setEvalNumQuestions(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] text-[#4A3B32] font-medium appearance-none"
                                            >
                                                {[1, 2, 3, 5].map(num => (
                                                    <option key={num} value={num}>{num} Questions</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a6a5c] pointer-events-none" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerateSubjectiveTest}
                                        disabled={evalLoading}
                                        className="w-full py-4 bg-[#C8A288] text-white rounded-xl hover:bg-[#B08B72] font-bold disabled:opacity-50 transition-colors mt-4 flex items-center justify-center gap-2"
                                    >
                                        {evalLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                                        {evalLoading ? 'Generating...' : 'Start Evaluation'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-20 px-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold">{evalTest.topic || 'Subjective'} Evaluation</h3>
                                        <p className="text-sm text-[#8a6a5c]">{evalTest.questions.length} Questions</p>
                                    </div>
                                    <button
                                        onClick={handleResetSubjectiveTest}
                                        className="text-[#C8A288] hover:text-[#B08B72] font-medium flex items-center gap-1"
                                    >
                                        <LogOut className="h-4 w-4 rotate-180" /> Back
                                    </button>
                                </div>

                                {evalResult && (
                                    <div className="bg-white p-6 rounded-2xl border border-[#E6D5CC] shadow-sm text-center">
                                        <h4 className="text-lg font-bold text-[#4A3B32] mb-2">Evaluation Report</h4>
                                        <div className="text-3xl font-bold text-[#C8A288] mb-1">{evalResult.total_score} / {evalResult.max_score}</div>
                                        <p className="text-[#8a6a5c] mb-4">{evalResult.percentage.toFixed(0)}% Score</p>

                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={handleResetSubjectiveTest}
                                                className="px-6 py-2 bg-[#C8A288] text-white rounded-lg hover:bg-[#B08B72] font-medium transition-colors"
                                            >
                                                New Evaluation
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {evalTest.questions.map((q, i) => {
                                    const result = evalResult?.evaluations?.find(e => String(e.question_id) === String(q.id));
                                    return (
                                        <div key={q.id} className="p-6 bg-[#FDF6F0] rounded-2xl border border-[#E6D5CC] shadow-sm">
                                            <div className="font-bold text-lg mb-4 flex gap-2">
                                                <span>{i + 1}.</span>
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{q.question}</ReactMarkdown>
                                                </div>
                                            </div>

                                            {!evalResult ? (
                                                <textarea
                                                    value={evalUserAnswers[q.id] || ''}
                                                    onChange={(e) => handleSubjectiveAnswerChange(q.id, e.target.value)}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-white border border-[#E6D5CC] rounded-xl focus:ring-2 focus:ring-[#C8A288] outline-none resize-none"
                                                    placeholder="Type your answer here..."
                                                />
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="bg-white p-4 rounded-xl border border-[#E6D5CC]">
                                                        <p className="text-xs text-[#8a6a5c] uppercase font-bold mb-1">Your Answer</p>
                                                        <p className="text-[#4A3B32]">{result?.user_answer}</p>
                                                    </div>

                                                    <div className={`p-4 rounded-xl border ${result?.score >= 7 ? 'bg-green-50 border-green-200' :
                                                        result?.score >= 4 ? 'bg-yellow-50 border-yellow-200' :
                                                            'bg-red-50 border-red-200'
                                                        }`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="font-bold text-sm uppercase opacity-80">AI Feedback</p>
                                                            <span className="font-bold text-lg">{result?.score}/10</span>
                                                        </div>
                                                        <div className="mb-2 prose prose-sm max-w-none">
                                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result?.feedback}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {!evalResult && (
                                    <div className="pt-4 pb-8">
                                        <button
                                            onClick={handleSubmitSubjectiveTest}
                                            disabled={evalLoading || Object.keys(evalUserAnswers).length === 0}
                                            className="w-full py-4 bg-[#C8A288] text-white rounded-xl hover:bg-[#B08B72] font-bold text-lg shadow-sm disabled:opacity-50 transition-all transform active:scale-[0.99]"
                                        >
                                            {evalLoading ? 'Evaluating Answers...' : 'Submit All Answers'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Quiz Mode Toggle - Sticky Bottom Footer */}
            <div className="flex-none p-4 bottom-0 w-full border-t border-[#E6D5CC] bg-[#FDF6F0]/95 backdrop-blur-md z-10">
                <div className="flex justify-center">
                    <div className="bg-[#E6D5CC]/40 p-1.5 rounded-xl flex gap-1 shadow-inner">
                        <button
                            onClick={() => setQuizMode('mcq')}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${quizMode === 'mcq' ? 'bg-[#C8A288] text-white shadow-md transform scale-105' : 'text-[#8a6a5c] hover:bg-white/50'}`}
                        >
                            Multiple Choice
                        </button>
                        <button
                            onClick={() => setQuizMode('subjective')}
                            className={`px-6 py-3 rounded-lg text-sm font-bold transition-all ${quizMode === 'subjective' ? 'bg-[#C8A288] text-white shadow-md transform scale-105' : 'text-[#8a6a5c] hover:bg-white/50'}`}
                        >
                            Subjective
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizView;
