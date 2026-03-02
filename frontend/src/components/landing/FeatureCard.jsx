import React from 'react';
import { motion } from 'framer-motion';
import { t } from '../../lib/landingData';

/* ═══════════════════════════════════════════════════════════
   FEATURE CARD
═══════════════════════════════════════════════════════════ */
export default function FeatureCard({ feature, index, dark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className={`${t.glass(dark)} rounded-2xl p-7 flex flex-col gap-4 group cursor-default`}
    >
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
        <feature.icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className={`text-lg font-bold ${t.heading(dark)}`}>{feature.title}</h3>
        <p className={`text-sm leading-relaxed ${t.body(dark)}`}>{feature.desc}</p>
      </div>
    </motion.div>
  );
}
