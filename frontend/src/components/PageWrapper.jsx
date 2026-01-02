import { motion } from "framer-motion";

export default function PageWrapper({ children }) {
  return (
    <div className="relative min-h-screen w-full">
      {children}
    </div>
  );
}

