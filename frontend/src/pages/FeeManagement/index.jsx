import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, CreditCard, LayoutDashboard, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FeeDashboard from './FeeDashboard';
import StudentFees from './StudentFees';
import PaymentHistory from './PaymentHistory';
import StudentFeePortal from './StudentFeePortal';

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students',  label: 'Student Fees', icon: Users },
  { id: 'history',   label: 'Payment History', icon: CreditCard },
];

const STUDENT_TABS = [
  { id: 'my-fees',  label: 'My Fees', icon: IndianRupee },
];

export default function FeeManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const tabs = isAdmin ? ADMIN_TABS : STUDENT_TABS;
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="flex flex-col h-[calc(100vh)] overflow-hidden text-[var(--text-main)]">
      {/* ── Header ── */}
      <div className="px-8 pt-8 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <IndianRupee size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Fee Management</h1>
            <p className="text-sm text-[var(--text-muted)]">
              {isAdmin ? 'Track fees, collect payments & generate receipts' : 'Your fee summary and payment history'}
            </p>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 mt-6 border-b border-[var(--border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-xl ${
                activeTab === tab.id
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass)]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="fee-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isAdmin ? (
              <>
                {activeTab === 'dashboard' && <FeeDashboard />}
                {activeTab === 'students'  && <StudentFees />}
                {activeTab === 'history'   && <PaymentHistory />}
              </>
            ) : (
              <StudentFeePortal />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
