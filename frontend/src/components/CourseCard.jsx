import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Edit, Trash2 } from 'lucide-react';

const CourseCard = ({ title, image, onClick, onEdit, onDelete }) => {
  useTheme();
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="rounded-2xl overflow-hidden shadow-2xl cursor-pointer group border border-[var(--border)] relative bg-[var(--card)] transition-all duration-300"
    >
      {/* Admin Actions */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg transition-all active:scale-90"
              title="Edit Course"
            >
              <Edit size={16} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-lg transition-all active:scale-90"
              title="Delete Course"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      <div className="relative h-56 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Simple Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className={`p-6 text-center border-t border-[var(--border)] bg-[var(--glass)] text-[var(--text-main)]`}>
        <h3 className="text-[var(--text-main)] text-xl font-bold tracking-tight group-hover:text-indigo-400 transition-colors">{title}</h3>
        <p className="text-[var(--text-muted)] text-sm mt-1">Click to view details</p>
      </div>
    </motion.div>
  );
};

export default CourseCard;
