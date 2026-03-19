import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Calendar, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Success() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-white text-center shadow-2xl shadow-slate-200"
      >
        <div className="bg-emerald-600 px-8 py-12 text-white">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Registration Successful!</h1>
          <p className="mt-2 text-emerald-100">You've been successfully registered for the event.</p>
        </div>

        <div className="space-y-8 p-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
              <Calendar className="mb-3 text-emerald-600" size={24} />
              <h3 className="font-bold text-slate-900">Next Steps</h3>
              <p className="mt-1 text-sm text-slate-500">Check your email for event details and schedule.</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-left">
              <Info className="mb-3 text-emerald-600" size={24} />
              <h3 className="font-bold text-slate-900">Stay Updated</h3>
              <p className="mt-1 text-sm text-slate-500">Follow IEEE Student Branch on social media.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link 
              to="/register" 
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 text-lg font-bold text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            >
              Back to Registration
              <ArrowRight size={20} />
            </Link>
            <p className="text-sm text-slate-400 italic">Thank you for being part of the IEEE community!</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
