import React from "react";


export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="hidden lg:flex flex-1 items-center justify-center">
        <div className="w-72 h-72 rounded-full bg-primary-500 text-white flex items-center justify-center font-extrabold" style={{ fontSize: 150 }}>
          C
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden mb-8">
            <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-extrabold">C</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}