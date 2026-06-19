import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const RoleCard = ({ role, title, icon: Icon, description, color, from }) => {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link to={`/login/${role}`} state={{ from: from ? { pathname: from } : null }} style={{ textDecoration: 'none' }}>
        <div className="glass-card role-card">
          <div className="icon-wrapper" style={{ background: color }}>
            <Icon size={32} color="white" />
          </div>
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="card-footer">
            <span>Get Started</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default RoleCard;
