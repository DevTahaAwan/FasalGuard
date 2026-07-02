'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Phone, Navigation } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { AppLayout } from '@/components/layouts/AppLayout';
import { MOCK_DEALERS } from '@/lib/mock/dealers';
import type { Dealer } from '@/types/api';
import { StatusBar } from '@/components/ui/StatusBar';

async function fetchDealers(): Promise<Dealer[]> {
  await new Promise((r) => setTimeout(r, 600));
  return MOCK_DEALERS;
}

export default function DealersPage() {
  const router = useRouter();
  const { language } = useAppStore();
  const isRTL = language === 'ur';

  const { data, isLoading } = useQuery({
    queryKey: ['dealers'],
    queryFn: fetchDealers,
  });

  const [mapUrl, setMapUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const bbox = `${longitude - 0.05},${latitude - 0.05},${longitude + 0.05},${latitude + 0.05}`;
        setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`);
      });
    }
  }, []);

  return (
    <AppLayout>
      <div className="screen active" id="screen-dealers">
        <StatusBar />
        <div className="simple-header">
          <div className="back-btn" onClick={() => router.back()}>
            <ArrowLeft color="#fff" size={20} />
          </div>
          <div className="screen-title">{isRTL ? 'قریبی دکانیں' : 'Nearby Dealers'}</div>
        </div>

        <div className="scroll-content" style={{ paddingTop: '20px' }}>
          {mapUrl ? (
            <iframe
              width="100%"
              height="200"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={mapUrl}
              style={{ border: '1px solid #e5e7eb', borderRadius: '12px', marginBottom: '16px' }}
            ></iframe>
          ) : (
            <div className="map-placeholder">
              <MapPin size={36} color="var(--green-accent)" />
              <span>{isRTL ? 'نقشہ لوڈ ہو رہا ہے...' : 'Loading map...'}</span>
            </div>
          )}

          {isLoading ? (
            <p>Loading...</p>
          ) : data && data.length > 0 ? (
            data.map((dealer) => (
              <div key={dealer.id} className="dealer-card">
                <div className="dealer-icon">
                  <MapPin color="var(--green-primary)" size={22} />
                </div>
                <div className="dealer-info">
                  <div className="dealer-name">{isRTL ? dealer.name_ur : dealer.name}</div>
                  <div className="dealer-addr">{isRTL ? dealer.address_ur : dealer.address}</div>
                  <div className="dealer-dist">{dealer.distance_km} km away</div>
                </div>
                <div className="dealer-actions">
                  <div className="dealer-action-btn" onClick={() => window.location.href = `tel:${dealer.phone}`}>
                    <Phone size={18} />
                  </div>
                  <div className="dealer-action-btn" onClick={() => window.open(`https://maps.google.com/?q=${dealer.lat},${dealer.lng}`)}>
                    <Navigation size={18} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No dealers found</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
