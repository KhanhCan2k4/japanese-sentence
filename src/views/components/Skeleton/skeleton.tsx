import { motion } from "motion/react";
import React from "react";

type SkeletonProps = {
  className?: string;
  style?: React.CSSProperties;
};

export default function Skeleton({ className, style }: SkeletonProps) {
  return (
    <motion.div
      className={"rounded app bg-primary " + className}
      style={style}
      animate={{
        opacity: [0.3, 0.1, 0.3],
        transition: {
          duration: 2,
          ease: "easeInOut",
          repeatType: "loop",

          repeat: Number.POSITIVE_INFINITY,
        },
      }}
    />
  );
}
