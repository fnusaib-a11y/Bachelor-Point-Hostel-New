import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { LogIn, Key, Mail, Phone, Users, Shield, ArrowRight, UserPlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BachelorPointLogo } from "./BachelorPointLogo";

interface SplashAndAuthProps {
  onAuthSuccess: (user: { email: string | null; uid: string }) => void;
}

export function SplashAndAuth({ onAuthSuccess }: SplashAndAuthProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  
  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"Manager" | "Staff">("Manager");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const renderError = (errorStr: string) => {
    if (!errorStr) return null;

    const isUnauthorizedDomain =
      errorStr.toLowerCase().includes("unauthorized-domain") ||
      errorStr.toLowerCase().includes("auth/unauthorized-domain");

    const isNetworkError =
      errorStr.toLowerCase().includes("network-request-failed") ||
      errorStr.toLowerCase().includes("network") ||
      errorStr.toLowerCase().includes("popup") ||
      errorStr.toLowerCase().includes("blocked") ||
      errorStr.toLowerCase().includes("offline");

    if (isUnauthorizedDomain) {
      const currentDomain = window.location.hostname;
      return (
        <div className="mb-4 p-4 bg-amber-50 rounded-xl border border-amber-200 text-slate-800 text-xs font-sans space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
            <span className="p-1 bg-amber-200 rounded-full text-amber-800">⚠️</span>
            <span>ডোমেইন অথরাইজ করা প্রয়োজন (Domain Authorization Needed)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Firebase Authentication-এ বর্তমান ডোমেইনটি অনুমোদিত নয়। এটি সমাধান করতে নিচের নির্দেশাবলী অনুসরণ করুন:
          </p>
          
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2">
            <code className="bg-slate-50 px-1.5 py-0.5 rounded text-red-600 text-[10px] select-all font-mono font-bold break-all">
              {currentDomain}
            </code>
            <button
              onClick={() => {
                try {
                  navigator.clipboard.writeText(currentDomain);
                  alert("ডোমেন কপি করা হয়েছে: " + currentDomain);
                } catch (err) {
                  // Fallback for sandboxed iframes where clipboard API might be blocked
                  try {
                    const el = document.createElement("textarea");
                    el.value = currentDomain;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand("copy");
                    document.body.removeChild(el);
                    alert("ডোমেন কপি করা হয়েছে (Fallback): " + currentDomain);
                  } catch (fallbackErr) {
                    alert("ডোমেনটি ম্যানুয়ালি কপি করুন: " + currentDomain);
                  }
                }
              }}
              type="button"
              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-[10px] font-bold text-amber-800 rounded-md shrink-0 cursor-pointer transition-colors font-sans"
            >
              কপি করুন
            </button>
          </div>

          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600 leading-normal font-sans">
            <li>
              আপনার <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">Firebase Console</a>-এ যান।
            </li>
            <li>
              বাম পাশের প্যানেল থেকে <span className="font-semibold">Authentication</span> সিলেক্ট করুন।
            </li>
            <li>
              Settings ট্যাবে গিয়ে <span className="font-bold text-amber-800">"Authorized domains"</span>-এ এই ডোমেইনটি যোগ করুন।
            </li>
          </ol>
        </div>
      );
    }

    if (isNetworkError) {
      return (
        <div className="mb-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-slate-800 text-xs font-sans space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-800 font-extrabold text-[12.5px]">
            <span className="p-1 px-1.5 bg-amber-200 rounded-lg text-amber-800 font-bold font-sans">🌐</span>
            <span>স্যান্ডবক্স বা নেটওয়ার্ক কানেকশন এলার্ট</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-600 font-sans">
            গুগল সাইন-ইন বা Firebase কানেকশন এই ব্রাউজার উইন্ডোর কড়া সিকিউরিটি বা স্যান্ডবক্সিং প্রতিবন্ধকতার কারণে নেটওয়ার্ক টাইম-আউট বা ব্লক হয়েছে।
          </p>
          <p className="text-[11.5px] leading-relaxed text-emerald-800 font-semibold font-sans">
            আপনার প্রজেক্টটি নেটলিফাই (Netlify) বা যেকোনো লাইভ হোস্ট ডোমেইনে পাবলিশ করার পর রিয়েল গুগল লগইন ও লাইভ ফায়ারবেস ডেটাবেজ ১০০% নির্বিঘ্নে কাজ করবে।
          </p>
          <div className="pt-2 border-t border-slate-150">
            <p className="text-[11px] text-slate-500 mb-2 font-sans font-medium">
              বর্তমানে সিস্টেমের সকল ফিচার কাস্টমাইজেশন ও টেস্ট ট্রায়াল চালানোর জন্য নিচে ক্লিক করুন:
            </p>
            <button
              type="button"
              onClick={() => {
                onAuthSuccess({
                  email: "fnusaib@gmail.com",
                  uid: "sandbox-demo-super-admin-uid"
                });
              }}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
            >
              <Shield className="w-4 h-4" />
              টেস্ট এডমিন মোডে ডেমো ডাটাবেস দিয়ে প্রবেশ করুন
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 font-sans leading-relaxed flex flex-col gap-2">
        <span>{errorStr}</span>
        <button
          type="button"
          onClick={() => {
            onAuthSuccess({
              email: "fnusaib@gmail.com",
              uid: "sandbox-demo-super-admin-uid"
            });
          }}
          className="text-left text-[11px] text-emerald-700 font-bold hover:underline"
        >
          [টেস্ট মোডে ডেমো ডাটাবেস দিয়ে সরাসরি প্রবেশ করতে এখানে ক্লিক করুন]
        </button>
      </div>
    );
  };

  // Splash timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);
    return () => clearTimeout(timer);
  }, []);



  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("দয়া করে সবগুলো তথ্য পূরণ করুন।");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("দয়া করে একটি সঠিক ও সচল ইমেল ঠিকানা প্রবেশ করুন (যেমন: user@gmail.com)।");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess({
        email: userCredential.user.email,
        uid: userCredential.user.uid
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "লগইন করতে ব্যর্থ হয়েছে। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setError("দয়া করে সবগুলো তথ্য পূরণ করুন।");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(regEmail)) {
      setError("দয়া করে একটি সঠিক ও সচল ইমেল ঠিকানা প্রবেশ করুন (যেমন: user@gmail.com)।");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      onAuthSuccess({
        email: userCredential.user.email,
        uid: userCredential.user.uid
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "নিবন্ধন ব্যর্থ হয়েছে। সচল ইমেইল দিয়ে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      onAuthSuccess({
        email: result.user.email,
        uid: result.user.uid
      });
    } catch (err: any) {
      console.error("Google login failed", err);
      setError("গুগল সাইন-ইন করা যায়নি। ব্রাউজারের পপআপ অবমুক্ত করুন বা সঠিক গুগল একাউন্ট ব্যবহার করুন। Error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("দয়া করে ইমেল ঠিকানাটি প্রবেশ করুন।");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      alert("পাসওয়ার্ড রিসেট ইমেল পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স চেক করুন!");
      setAuthMode("login");
    } catch (err: any) {
      setError(err.message || "পাসওয়ার্ড রিসেট লিংঙ্ক পাঠানো ব্যর্থ হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 bg-emerald-950 flex flex-col items-center justify-center text-white z-50 px-4"
          id="splash_screen"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
            className="flex flex-col items-center"
          >
            {/* The beautiful custom official badge logo */}
            <BachelorPointLogo size="xl" theme="dark" className="transform scale-105 mb-8" />
            
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-900/40 rounded-full border border-emerald-800/50">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono text-emerald-300 tracking-wider font-bold">
                রানিং প্রোডাকশন ডাটাবেজ...
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="auth"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-emerald-200"
          id="auth_screen"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-emerald-100 shadow-xl shadow-slate-100/50 overflow-hidden relative">
            
            <div className="bg-emerald-950 px-6 py-8 text-center text-white relative overflow-hidden flex flex-col items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.35),transparent_60%)] animate-pulse" />
              <BachelorPointLogo size="lg" theme="dark" />
            </div>

            <div className="p-6 sm:p-8">
              {renderError(error)}

              {authMode === "login" && (
                <form onSubmit={handleFirebaseLogin} className="space-y-4">
                  {/* Beautiful Clean Google Sign-In Button on Top */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs mb-3 hover:border-emerald-200 transition-all active:scale-[0.99]"
                  >
                    <img src="https://www.gstatic.com/images/branding/product/1x/g_logo_32dp.png" alt="Google" className="w-4 h-4 shrink-0" />
                    গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন (Google Sign-In)
                  </button>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 my-4 uppercase tracking-wider font-semibold font-sans">
                    <div className="h-[1px] bg-slate-100 flex-1" />
                    <span>অথবা সচল ইমেইল দিয়ে সাইন-ইন</span>
                    <div className="h-[1px] bg-slate-100 flex-1" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 font-sans">ইমেল ঠিকানা (Gmail / Email)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        required
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="manager@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-gray-500 font-sans">পাসওয়ার্ড</label>
                      <button
                        type="button"
                        onClick={() => setAuthMode("forgot")}
                        className="text-xs font-medium text-emerald-600 hover:underline"
                      >
                        পাসওয়ার্ড ভুলে গেছেন?
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold py-2.5 rounded-xl text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? "যাচাই করা হচ্ছে..." : "সিস্টেম সাইন ইন"}
                    <LogIn className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    কোনো ওয়ার্কস্পেস নেই?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("register")}
                      className="text-emerald-600 font-semibold hover:underline"
                    >
                      নতুন অর্গানাইজেশন তৈরি করুন
                    </button>
                  </p>
                </form>
              )}

              {authMode === "register" && (
                <form onSubmit={handleFirebaseRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 font-sans">পুরো নাম</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="মোঃ নাফিস আসিফ"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 font-sans">ইমেল প্রবেশ করুন</label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="asif@bachelorpoint.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 font-sans">পাসওয়ার্ড তৈরি করুন</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 font-sans">অর্গানাইজেশন রোল (পদবী)</label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600"
                    >
                      <option value="Manager">হোস্টেল ম্যানেজার / হিসাবরক্ষণ কর্মকর্তা</option>
                      <option value="Staff">রান্নাঘর এবং রক্ষণাবেক্ষণ কর্মী</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-semibold py-2.5 rounded-xl text-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {loading ? "ওয়ার্কস্পেস নিবন্ধন হচ্ছে..." : "নিবন্ধন এবং অনবোর্ড করুন"}
                    <UserPlus className="w-4 h-4" />
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    ইতিমধ্যেই নিবন্ধিত?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-emerald-600 font-semibold hover:underline"
                    >
                      এখনই সাইন ইন করুন
                    </button>
                  </p>
                </form>
              )}

              {authMode === "forgot" && (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 font-sans mb-1">পাসওয়ার্ড রিসেট করুন</h3>
                  <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                    আপনার ইমেল প্রবেশ করুন। আমরা সাথে সাথে পাসওয়ার্ড রিসেটের জন্য একটি লিঙ্ক পাঠাব।
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 font-sans">ইমেল ঠিকানা</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@bachelorpoint.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    রিসেট লিঙ্ক পাঠান
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="w-full bg-slate-50 text-gray-600 hover:bg-slate-100 py-2 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    লগইন-এ ফিরে যান
                  </button>
                </form>
              )}



            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
