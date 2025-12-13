'use client'

import React, { useRef, useState, useCallback, memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { LucideIcon, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GradientCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  index?: number;
}

export const GradientCard = memo(({ icon: Icon, title, description, benefits, index = 0 }: GradientCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Hover state handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <motion.div
      ref={cardRef}
      className={cn(
        "relative rounded-[32px] overflow-hidden h-full group bg-black border border-white/10",
        "transition-colors duration-500 ease-out"
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background with Gradient Shadow */}
      <div className="absolute inset-0 z-0">
         {/* Blue background gradient shadow maintained as requested */}
         <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out"
          style={{
            background: `radial-gradient(800px circle at var(--mouse-x, center) var(--mouse-y, center), rgba(45, 45, 221, 0.15), transparent 40%)`
          }}
        />
        {/* Bottom subtle blue glow */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#2D2DDD]/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 p-8 sm:p-10 flex flex-col h-full">
        {/* Icon */}
        <div className="mb-6 inline-flex">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-[#111] border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 ease-out shadow-lg shadow-[#2D2DDD]/5 group-hover:shadow-[#2D2DDD]/20 group-hover:border-[#2D2DDD]/30">
               <Icon className="w-6 h-6 text-white group-hover:text-[#2D2DDD] transition-colors duration-300" />
            </div>
             {/* Icon Glow */}
            <div className="absolute inset-0 bg-[#2D2DDD] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-2xl" />
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-grow">
          <h3 className="text-2xl font-semibold font-figtree text-white mb-3 group-hover:text-[#2D2DDD] transition-colors duration-300">
            {title}
          </h3>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 font-figtree font-light">
            {description}
          </p>
        </div>

        {/* Benefits List */}
        <div className="mt-auto space-y-3 border-t border-white/5 pt-6 group-hover:border-white/10 transition-colors duration-500">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              className="flex items-start gap-3"
              initial={{ opacity: 0.8 }}
              whileHover={{ x: 4 }}
            >
              <div className="mt-1 w-4 h-4 rounded-full bg-[#2D2DDD]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#2D2DDD]/20 transition-colors duration-300">
                 <CheckCircle className="w-3 h-3 text-[#2D2DDD]" />
              </div>
              <span className="text-sm text-gray-300 font-figtree font-light group-hover:text-white transition-colors duration-300">
                {benefit}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

       {/* Hover Border Gradient */}
       <div 
        className="absolute inset-0 rounded-[32px] pointer-events-none border border-transparent group-hover:border-[#2D2DDD]/30 transition-colors duration-500"
        style={{
          boxShadow: isHovered ? "0 0 40px -10px rgba(45, 45, 221, 0.15)" : "none"
        }}
       />
    </motion.div>
  );
});

GradientCard.displayName = 'GradientCard';
