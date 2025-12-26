import React, { useState } from 'react';
import { HelpCircle, ChevronRight, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateSubjectiveTest } from '../../api';

const QAView = ({ projectId, availableTopics, selectedDocuments }) => {
    // Q&A State
    const [qaTopic, setQaTopic] = useState('');
    const [qaTopicSelection, setQaTopicSelection] = useState('');
    const [qaNumQuestions, setQaNumQuestions] = useState(5);
    const [qaTest, setQaTest] = useState(null);
    const [qaLoading, setQaLoading] = useState(false);
    const [qaRevealed, setQaRevealed] = useState({});

    const handleGenerateQA = async () => {
        setQaLoading(true);
        setQaTest(null);
        setQaRevealed({});

        try {
            const data = await generateSubjectiveTest(projectId, qaTopic, qaNumQuestions, selectedDocuments);
            setQaTest(data);
        } catch (error) {
            console.error("QA gen error", error);
            alert("Failed to generate Q&A");
        } finally {
            setQaLoading(false);
        }
    };

    const toggleAnswer = (idx) => {
        setQaRevealed(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto custom-scrollbar">
            {!qaTest ? (
                <div className="text-center py-12 animate-in fade-in slide-in-from-bottom-4">
                    <div className="h-20 w-20 bg-[#FDF6F0] rounded-full flex items-center justify-center mx-auto mb-6">
                        <HelpCircle className="h-10 w-10 text-[#C8A288]" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2 text-[#4A3B32]">Q&A Generation</h3>
                    <p className="text-[#8a6a5c] mb-8">Generate study questions and reveal answers one by one.</p>

                    <div className="max-w-md mx-auto space-y-4 bg-white p-6 md:p-8 rounded-3xl border border-[#E6D5CC] shadow-sm text-left">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-[#4A3B32] uppercase tracking-wide opacity-80">Topic</label>

                            {availableTopics.length > 0 ? (
                                <div className="relative">
                                    <select
                                        value={qaTopicSelection}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setQaTopicSelection(val);
                                            if (val !== '__custom__') setQaTopic(val);
                                            else setQaTopic('');
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
                                    {qaTopicSelection === '__custom__' && (
                                        <input
                                            type="text"
                                            value={qaTopic}
                                            onChange={(e) => setQaTopic(e.target.value)}
                                            placeholder="Enter custom topic..."
                                            className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288] mt-3 animate-in fade-in"
                                            autoFocus
                                        />
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={qaTopic}
                                    onChange={(e) => setQaTopic(e.target.value)}
                                    placeholder="Enter custom topic..."
                                    className="w-full px-5 py-3.5 bg-[#FDF6F0] border-0 rounded-xl focus:ring-2 focus:ring-[#C8A288]"
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-[#4A3B32] uppercase tracking-wide opacity-80">Number of Questions</label>
                            <div className="relative">
                                <select
                                    value={qaNumQuestions}
                                    onChange={(e) => setQaNumQuestions(parseInt(e.target.value))}
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
                            onClick={handleGenerateQA}
                            disabled={qaLoading}
                            className="w-full py-4 bg-[#C8A288] text-white rounded-xl hover:bg-[#B08B72] font-bold shadow-lg shadow-[#C8A288]/20 disabled:opacity-50 transition-colors mt-4"
                        >
                            {qaLoading ? 'Generating...' : 'Generate Questions'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold text-[#4A3B32]">{qaTest.topic || 'General'} Q&A</h3>
                        <button
                            onClick={() => setQaTest(null)}
                            className="px-4 py-2 border border-[#E6D5CC] rounded-lg hover:bg-[#FDF6F0] text-[#8a6a5c] font-medium transition-colors"
                        >
                            New Q&A
                        </button>
                    </div>

                    {qaTest.questions && qaTest.questions.map((pair, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-[#E6D5CC] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                            <button
                                onClick={() => toggleAnswer(idx)}
                                className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-gray-50 transition-colors group"
                            >
                                <div className="flex gap-4">
                                    <span className="flex-shrink-0 h-8 w-8 bg-[#FDF6F0] text-[#C8A288] rounded-full flex items-center justify-center font-bold text-sm">
                                        Q{idx + 1}
                                    </span>
                                    <h4 className="font-bold text-lg text-[#4A3B32] group-hover:text-[#C8A288] transition-colors">
                                        {pair.question}
                                    </h4>
                                </div>
                                <div className={`transform transition-transform duration-300 ${qaRevealed[idx] ? 'rotate-90' : ''}`}>
                                    <ChevronRight className="h-5 w-5 text-[#8a6a5c]" />
                                </div>
                            </button>

                            {qaRevealed[idx] && (
                                <div className="px-6 pb-6 pt-0 animate-in fade-in slide-in-from-top-2">
                                    <div className="pl-12">
                                        <div className="p-4 bg-[#FDF6F0] rounded-xl text-[#4A3B32] leading-relaxed border border-[#E6D5CC]">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {pair.answer}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QAView;
