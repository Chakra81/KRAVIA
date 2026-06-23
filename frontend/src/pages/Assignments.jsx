import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, CheckCircle, Clock, Upload, User as UserIcon, Edit, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Custom dark-themed dropdown to replace native <select>
const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)] flex justify-between items-center focus:border-indigo-500 focus:outline-none"
      >
        <span className={selected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''} text-[var(--text-muted)]`} />
      </button>

      {open && (
        <div className="absolute z-[200] mt-1 w-full rounded-xl border border-[var(--border)] overflow-hidden shadow-2xl"
          style={{ backgroundColor: 'var(--bg-card)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{ color: 'var(--text-main)' }}
              className={`px-4 py-2.5 cursor-pointer text-sm transition-colors
                ${ String(o.value) === String(value)
                  ? 'bg-indigo-500/30 text-indigo-300'
                  : 'hover:bg-indigo-500/10'
                }`}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Assignments() {
    const { user } = useAuth();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteData, setDeleteData] = useState(null);
    const [activeAssignment, setActiveAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [trainerBatches, setTrainerBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState('');

    const isTrainer = user?.role === 'trainer';
    const isAdmin = user?.role === 'admin';
    const canManage = isTrainer || isAdmin;

    useEffect(() => {
        if (user && user.email) {
            fetchAssignments();
            if (isTrainer) {
                fetchTrainerBatches();
            } else if (isAdmin) {
                fetchAllBatches();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchTrainerBatches = async () => {
        try {
            const res = await fetch(`https://kravia.onrender.com/api/trainer/my-courses/?email=${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setTrainerBatches(data);
            }
        } catch (error) {
            console.error('Error fetching batches', error);
        }
    };

    const fetchAllBatches = async () => {
        try {
            const res = await fetch(`https://kravia.onrender.com/api/list-courses/`);
            if (res.ok) {
                const data = await res.json();
                const courses = Array.isArray(data) ? data : (data.courses || []);
                // Flatten all batches from all courses
                const allBatches = courses.flatMap(c =>
                    (c.batches || []).map(b => ({
                        batch_id: b.id,
                        batch_name: b.name,
                        course_title: c.title,
                    }))
                );
                setTrainerBatches(allBatches);
            }
        } catch (error) {
            console.error('Error fetching all batches', error);
        }
    };

    const fetchAssignments = async () => {
        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/?email=${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setAssignments(data);
            }
        } catch (error) {
            console.error('Error fetching assignments', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async (assignmentId) => {
        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/${assignmentId}/submissions/?email=${user.email}`);
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (error) {
            console.error('Error fetching submissions', error);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        // Validate batch selection
        if (!selectedBatchId) {
            toast.error('Please select a batch before creating the assignment.');
            return;
        }

        const payload = {
            email: user.email,
            batch_id: selectedBatchId,          // use state directly — reliable
            title: formData.get('title'),
            description: formData.get('description'),
            due_date: formData.get('due_date'),
            status: formData.get('status') || 'draft',
        };

        console.log('Creating assignment with payload:', payload);

        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowCreateModal(false);
                setSelectedBatchId('');
                fetchAssignments();
                toast.success('Assignment created successfully');
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Backend error:', errData);
                toast.error(`Failed to create assignment: ${JSON.stringify(errData)}`);
            }
        } catch (error) {
            console.error('Error creating assignment', error);
            toast.error('Network error — check console for details.');
        }
    };

    const handleEditAssignment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/${editData.id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.get('title'),
                    description: formData.get('description'),
                    due_date: formData.get('due_date'),
                    status: formData.get('status'),
                })
            });
            if (res.ok) {
                setShowEditModal(false);
                fetchAssignments();
                if (activeAssignment?.id === editData.id) {
                    setActiveAssignment({
                        ...activeAssignment,
                        title: formData.get('title'),
                        description: formData.get('description'),
                        due_date: formData.get('due_date'),
                        status: formData.get('status')
                    });
                }
                toast.success('Assignment updated successfully');
            }
        } catch (error) {
            console.error('Error updating assignment', error);
            toast.error('Failed to update assignment');
        }
    };

    const handleDeleteAssignment = (assignment) => {
        setDeleteData(assignment);
        setShowDeleteModal(true);
    };

    const confirmDeleteAssignment = async () => {
        if (!deleteData) return;
        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/${deleteData.id}/`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setShowDeleteModal(false);
                if (activeAssignment?.id === deleteData.id) {
                    setActiveAssignment(null);
                }
                fetchAssignments();
                setDeleteData(null);
                toast.success('Assignment deleted successfully');
            }
        } catch (error) {
            console.error('Error deleting assignment', error);
            toast.error('Failed to delete assignment');
        }
    };

    const handleGradeSubmission = async (e, submissionId) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/submissions/${submissionId}/grade/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    score: formData.get('score'),
                    feedback: formData.get('feedback'),
                })
            });
            if (res.ok) {
                fetchSubmissions(activeAssignment.id);
            }
        } catch (error) {
            console.error('Error grading submission', error);
        }
    };
    
    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const res = await fetch(`https://kravia.onrender.com/api/assignments/${activeAssignment.id}/submissions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    submission_text: formData.get('submission_text'),
                    file_url: formData.get('file_url'),
                })
            });
            if (res.ok) {
                fetchSubmissions(activeAssignment.id);
                e.target.reset();
                toast.success('Assignment submitted successfully');
                
                // Log activity to heatmap
                try {
                    await fetch(`https://kravia.onrender.com/api/heatmap/log/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: user.email })
                    });
                } catch (err) {
                    console.error('Failed to log activity', err);
                }
            }
        } catch (error) {
            console.error('Error submitting assignment', error);
        }
    };

    return (
        <div className={`flex flex-col h-[calc(100vh-0px)] overflow-hidden text-[var(--text-main)]`}>
            {/* Header */}
            <div className="flex justify-between items-center px-8 pt-8 pb-4 flex-shrink-0">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                        Assignments
                    </h1>
                    <p className={`mt-2 text-[var(--text-muted)]`}>
                        {canManage ? 'Manage course assignments and grading' : 'View and submit your course assignments'}
                    </p>
                </div>
                
                {canManage && (
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} />
                        <span>Create Assignment</span>
                    </button>
                )}
            </div>

            {/* Scrollable two-column body */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 px-8 pb-8 min-h-0">
                {/* LEFT: Assignment List — independently scrollable */}
                <div className="lg:col-span-1 overflow-y-auto space-y-4 pr-1">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
                    ) : assignments.length === 0 ? (
                        <div className={`p-6 rounded-2xl border text-center bg-[var(--glass)] border border-[var(--border)]`}>
                            <p className="text-[var(--text-muted)]">No assignments available.</p>
                        </div>
                    ) : (
                        assignments.map(assignment => (
                            <div 
                                key={assignment.id}
                                onClick={() => {
                                    setActiveAssignment(assignment);
                                    fetchSubmissions(assignment.id);
                                }}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                                    activeAssignment?.id === assignment.id 
                                    ? 'border-indigo-500 bg-indigo-500/10'
                                    : 'border-[var(--border)] bg-[var(--glass)] hover:bg-[var(--glass-hover)]'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                    <div className={`p-2 rounded-lg bg-[var(--glass)] text-[var(--text-main)]`}>
                                        <FileText size={18} />
                                    </div>
                                </div>
                                <p className={`text-sm mb-3 text-[var(--text-muted)]`}>
                                    Batch: {assignment.batch_name}
                                    {assignment.status === 'draft' && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                                            Draft
                                        </span>
                                    )}
                                </p>
                                <div className="flex items-center gap-4 text-xs font-medium">
                                    <div className={`flex items-center gap-1 ${new Date(assignment.due_date) < new Date() ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        <Clock size={14} />
                                        {new Date(assignment.due_date).toLocaleDateString()}
                                    </div>
                                    <div className="text-[var(--text-muted)]">
                                        Max: {assignment.max_score} pts
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* RIGHT: Assignment Details — independently scrollable */}
                <div className="lg:col-span-2 overflow-y-auto">
                    {activeAssignment ? (
                        <div className={`rounded-2xl border overflow-hidden bg-[var(--glass)] border border-[var(--border)]`}>
                            <div className={`p-6 border-b flex justify-between items-start border-[var(--border)]`}>
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">{activeAssignment.title}</h2>
                                    <p className={`text-sm mb-6 text-[var(--text-muted)]`}>
                                        {activeAssignment.description}
                                    </p>
                                </div>
                                {canManage && (
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditData(activeAssignment); setShowEditModal(true); }} className={`p-2 rounded-lg transition-colors bg-[var(--glass)] text-[var(--text-main)]`} title="Edit Assignment">
                                            <Edit size={20} />
                                        </button>
                                        <button onClick={() => handleDeleteAssignment(activeAssignment)} className={`p-2 rounded-lg transition-colors bg-[var(--glass)] text-[var(--text-main)]`} title="Delete Assignment">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                {canManage ? (
                                    // Trainer View: Grade Submissions
                                    <div>
                                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                            <CheckCircle size={20} className="text-indigo-500" />
                                            Submissions ({submissions.length})
                                        </h3>
                                        <div className="space-y-4">
                                            {submissions.length === 0 ? (
                                                <p className="text-[var(--text-muted)]">No submissions yet.</p>
                                            ) : submissions.map(sub => (
                                                <div key={sub.id} className={`p-5 rounded-xl border bg-[var(--glass)] border border-[var(--border)]`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[var(--glass)] text-[var(--text-main)]`}>
                                                                <UserIcon size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{sub.student_name}</p>
                                                                <p className="text-xs text-slate-500">{new Date(sub.submitted_at).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        {sub.score !== null ? (
                                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-500">
                                                                Graded: {sub.score} / {activeAssignment.max_score}
                                                            </span>
                                                        ) : (
                                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/20 text-amber-500">
                                                                Needs Grading
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className={`p-4 rounded-lg mb-4 text-sm bg-[var(--glass)]`}>
                                                        {sub.submission_text || 'No text provided.'}
                                                        {sub.file_url && (
                                                            <a href={sub.file_url} target="_blank" rel="noreferrer" className="block mt-2 text-indigo-500 hover:underline">
                                                                View Attachment
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Grading Form */}
                                                    <form onSubmit={(e) => handleGradeSubmission(e, sub.id)} className="flex gap-4 items-end">
                                                        <div className="flex-1">
                                                            <label className={`block text-xs mb-1 text-[var(--text-muted)]`}>Feedback</label>
                                                            <input 
                                                                type="text" 
                                                                name="feedback" 
                                                                defaultValue={sub.feedback || ''}
                                                                className={`w-full px-3 py-2 rounded-lg text-sm outline-none border border-[var(--border)] bg-[var(--glass)]`} 
                                                                placeholder="Great job..."
                                                            />
                                                        </div>
                                                        <div className="w-24">
                                                            <label className={`block text-xs mb-1 text-[var(--text-muted)]`}>Score</label>
                                                            <input 
                                                                type="number" 
                                                                name="score" 
                                                                defaultValue={sub.score || ''}
                                                                required
                                                                max={activeAssignment.max_score}
                                                                className={`w-full px-3 py-2 rounded-lg text-sm outline-none border border-[var(--border)] bg-[var(--glass)]`} 
                                                            />
                                                        </div>
                                                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                                                            Save
                                                        </button>
                                                    </form>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Student View: Submit Work
                                    <div>
                                        {submissions.length > 0 ? (
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-emerald-500 font-semibold mb-4">
                                                    <CheckCircle size={24} />
                                                    <span>Assignment Submitted</span>
                                                </div>
                                                
                                                <div className={`p-6 rounded-xl border bg-[var(--glass)] border border-[var(--border)]`}>
                                                    <h4 className="font-semibold mb-2">Your Submission:</h4>
                                                    <p className={`text-sm mb-4 text-[var(--text-muted)]`}>
                                                        {submissions[0].submission_text}
                                                    </p>
                                                    {submissions[0].file_url && (
                                                        <a href={submissions[0].file_url} className="text-indigo-500 hover:underline text-sm font-medium">View Attached File</a>
                                                    )}
                                                </div>

                                                {submissions[0].score !== null && (
                                                    <div className={`p-6 rounded-xl border bg-[var(--glass)] text-[var(--text-main)]`}>
                                                        <h4 className="font-bold text-emerald-600 mb-1 flex justify-between">
                                                            <span>Grade Received</span>
                                                            <span>{submissions[0].score} / {activeAssignment.max_score}</span>
                                                        </h4>
                                                        {submissions[0].feedback && (
                                                            <p className={`text-sm mt-2 bg-[var(--glass)] text-[var(--text-main)]`}>
                                                                " {submissions[0].feedback} "
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSubmitAssignment} className="space-y-4">
                                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                                    <Upload size={20} className="text-indigo-500" />
                                                    Submit Your Work
                                                </h3>
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 text-[var(--text-main)]`}>Comments / Text Submission</label>
                                                    <textarea 
                                                        name="submission_text"
                                                        rows="4" 
                                                        required
                                                        className={`w-full p-3 rounded-xl border outline-none bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`}
                                                        placeholder="Type your answer or provide a link to your repository..."
                                                    ></textarea>
                                                </div>
                                                <div>
                                                    <label className={`block text-sm font-medium mb-1 text-[var(--text-main)]`}>File Link (Optional)</label>
                                                    <input 
                                                        name="file_url"
                                                        type="url"
                                                        className={`w-full p-3 rounded-xl border outline-none bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`}
                                                        placeholder="https://drive.google.com/..."
                                                    />
                                                </div>
                                                <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                                                    Submit Assignment
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--glass)]`}>
                            <FileText size={48} className="text-[var(--text-muted)] opacity-50" />
                            <p className={`mt-4 text-lg text-[var(--text-muted)]`}>Select an assignment to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 glass-card`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Create Assignment</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateAssignment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Batch</label>
                                {/* hidden input so FormData still picks up batch_id */}
                                <input type="hidden" name="batch_id" value={selectedBatchId} />
                                <CustomSelect
                                    placeholder="Select a batch..."
                                    value={selectedBatchId}
                                    onChange={setSelectedBatchId}
                                    options={trainerBatches.map(b => ({ value: b.batch_id, label: `${b.batch_name} (${b.course_title})` }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input name="title" type="text" required className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea name="description" rows="3" required className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input name="due_date" type="datetime-local" required style={{colorScheme:'dark'}} className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select name="status" defaultValue="draft" className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`}>
                                    <option value="draft" className="bg-[#1e1e2d] text-white">Draft (Hidden from Students)</option>
                                    <option value="active" className="bg-[#1e1e2d] text-white">Active (Visible)</option>
                                </select>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className={`flex-1 py-2 rounded-xl font-medium bg-[var(--glass)] hover:brightness-110 text-[var(--text-main)]`}>Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Modal */}
            {showEditModal && editData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 glass-card`}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Edit Assignment</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditAssignment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input name="title" type="text" defaultValue={editData.title} required className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea name="description" rows="3" defaultValue={editData.description} required className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Due Date</label>
                                <input name="due_date" type="datetime-local" defaultValue={new Date(editData.due_date).toISOString().slice(0, 16)} required style={{colorScheme:'dark'}} className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select name="status" defaultValue={editData.status || 'draft'} className={`w-full px-4 py-2 rounded-xl outline-none border bg-[var(--glass)] border-[var(--border)] text-[var(--text-main)] focus:border-indigo-500`}>
                                    <option value="draft" className="bg-[#1e1e2d] text-white">Draft (Hidden from Students)</option>
                                    <option value="active" className="bg-[#1e1e2d] text-white">Active (Visible)</option>
                                </select>
                            </div>
                            
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className={`flex-1 py-2 rounded-xl font-medium bg-[var(--glass)] hover:brightness-110 text-[var(--text-main)]`}>Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center glass-card`}>
                        <div className={`mx-auto w-12 h-12 mb-4 rounded-full flex items-center justify-center bg-[var(--glass)] text-[var(--text-main)]`}>
                            <Trash2 size={24} />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Delete Assignment?</h2>
                        <p className={`text-sm mb-6 text-[var(--text-muted)]`}>
                            Are you sure you want to delete <span className="font-semibold text-current">{deleteData.title}</span>? This action cannot be undone and will remove all associated submissions.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowDeleteModal(false); setDeleteData(null); }} className={`flex-1 py-2 rounded-xl font-medium bg-[var(--glass)] hover:brightness-110 text-[var(--text-main)]`}>Cancel</button>
                            <button onClick={confirmDeleteAssignment} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
