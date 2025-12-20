import React, { useState, useEffect } from 'react';
import { Headphones } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './MusicPreloader.css';

const MusicPreloader = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [noDisplay, setNoDisplay] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNoDisplay(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {!noDisplay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showPopup ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`preloader-popup ${showPopup ? 'show' : 'hide'}`}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="inline-block mb-4"
            >
              <Headphones className="w-16 h-16 sm:w-20 sm:h-20 text-teal-400" strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Headphones
            </h2>
            <p className="text-lg sm:text-xl text-white/80">
              Recommended
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MusicPreloader;
