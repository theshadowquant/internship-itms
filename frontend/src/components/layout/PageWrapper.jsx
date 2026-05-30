import React from 'react';
import { motion } from 'framer-motion';

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-full flex flex-col flex-1 px-1 py-4 md:p-6 pb-20 md:pb-6"
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
