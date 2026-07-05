'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Camera, Clock } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <div dir="ltr" className="bottom-nav">
      <Link href="/home" className={`nav-item ${pathname === '/home' ? 'active' : ''}`}>
        <div className="nav-icon">
          <Home aria-hidden="true" size={22} />
        </div>
        <div className="nav-label">Home</div>
      </Link>
      
      <Link href="/scanner" className="nav-center">
        <div className="nav-scan-btn" aria-label="Scan crop">
          <Camera aria-hidden="true" size={24} color="#fff" />
        </div>
        <div className="nav-label" style={{ color: 'var(--green-primary)', fontWeight: 600 }}>Scan</div>
      </Link>

      <Link href="/history" className={`nav-item ${pathname === '/history' ? 'active' : ''}`}>
        <div className="nav-icon">
          <Clock aria-hidden="true" size={22} />
        </div>
        <div className="nav-label">History</div>
      </Link>
    </div>
  );
};
