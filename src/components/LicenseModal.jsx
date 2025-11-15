/**
 * Striven - Privacy-First Fitness Tracker
 * Copyright (c) 2025 Rodney Austria
 * Licensed under the MIT License
 */

import React from 'react';
import { X, Shield, Code, Heart, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LicenseModal = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Striven</h2>
                <p className="text-white/60">Privacy-First Fitness Tracker</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-white/60" />
              </button>
            </div>

            {/* Developer Info */}
            <a
              href="https://www.linkedin.com/in/rodney-austria-/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit Rodney Austria on LinkedIn"
              title="Visit Rodney Austria on LinkedIn"
              className="block bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20 rounded-2xl p-6 mb-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-emerald-400 to-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-200">
                      Developed by Rodney Austria
                    </h3>
                    <ExternalLink className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <p className="text-emerald-400 text-sm font-medium">© 2025 All Rights Reserved</p>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Built with passion for privacy and fitness. This app stores all your data locally on your device - no servers, no tracking, no compromises.
              </p>
            </a>

            {/* License Section */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2 text-white">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold">MIT License</h3>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-white/70 text-sm font-mono leading-relaxed">
                <p className="mb-3">Copyright (c) 2025 Rodney Austria</p>
                <p className="mb-3">
                  Permission is hereby granted, free of charge, to any person obtaining a copy
                  of this software and associated documentation files (the "Software"), to deal
                  in the Software without restriction, including without limitation the rights
                  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                  copies of the Software, and to permit persons to whom the Software is
                  furnished to do so, subject to the following conditions:
                </p>
                <p className="mb-3">
                  The above copyright notice and this permission notice shall be included in all
                  copies or substantial portions of the Software.
                </p>
                <p className="text-white/50 text-xs">
                  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Shield className="w-6 h-6 text-green-400 mb-2" />
                <h4 className="text-white font-semibold text-sm mb-1">Privacy First</h4>
                <p className="text-white/60 text-xs">100% local storage</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <Heart className="w-6 h-6 text-red-400 mb-2" />
                <h4 className="text-white font-semibold text-sm mb-1">Open Source</h4>
                <p className="text-white/60 text-xs">MIT Licensed</p>
              </div>
            </div>

            {/* Version Info */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/40 text-sm">Version 1.0.0</p>
              
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LicenseModal;
