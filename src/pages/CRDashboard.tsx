import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Calendar, Trophy, Share2, CheckCircle2, QrCode, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';

interface CRStats {
  cr: {
    name: string;
    class_name: string;
    referral_code: string;
  };
  stats: {
    event_name: string;
    count: number;
  }[];
}

export default function CRDashboard() {
  const { referralCode } = useParams<{ referralCode: string }>();
  const [data, setData] = useState<CRStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    if (!referralCode) return;
    fetch(`/api/cr/stats/${referralCode}`)
      .then(res => {
        if (!res.ok) throw new Error('CR not found');
        return res.json();
      })
      .then(data => setData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [referralCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" /></div>;
  if (error || !data) return <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center"><p className="text-xl font-bold text-slate-900">{error || 'CR not found'}</p><Link to="/" className="text-indigo-600 hover:underline">Go back home</Link></div>;

  const totalRegistrations = data.stats.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/" className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-all hover:text-indigo-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">CR Dashboard</h1>
          <p className="text-slate-500">Track your referral performance for IEEE events.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100">
              <Trophy size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{data.cr.name}</h2>
            <p className="text-slate-500">{data.cr.class_name}</p>
            
            <div className="mt-8 space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registrations</p>
                <p className="text-3xl font-bold text-indigo-600">{totalRegistrations}</p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Link Identifier</p>
                <p className="font-mono text-xl font-bold text-indigo-600">{data.cr.referral_code}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
            <h3 className="mb-4 font-bold text-slate-900">Share Your Link</h3>
            <div className="mx-auto mb-6 flex justify-center rounded-xl bg-slate-50 p-4">
              <QRCodeSVG value={referralLink} size={150} />
            </div>
            <button 
              onClick={handleCopy}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
            >
              {copied ? <CheckCircle2 size={20} /> : <Share2 size={20} />}
              {copied ? 'Link Copied!' : 'Copy Referral Link'}
            </button>
          </div>
        </motion.div>

        {/* Stats List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
              <h3 className="text-lg font-bold text-slate-900">Event-wise Performance</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {data.stats.map(stat => (
                <div key={stat.event_name} className="flex items-center justify-between px-8 py-6 transition-colors hover:bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{stat.event_name}</p>
                      <p className="text-xs text-slate-500">IEEE College Event</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400">Registrations</p>
                  </div>
                </div>
              ))}
              {data.stats.length === 0 && (
                <div className="px-8 py-12 text-center text-slate-500 italic">
                  No active events tracked yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-xl shadow-slate-200">
            <h3 className="mb-2 text-xl font-bold">Pro Tip 🚀</h3>
            <p className="text-slate-400">Share your QR code in your class WhatsApp group and during lectures to maximize your registrations. The top CR will be rewarded at the end of the event!</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
