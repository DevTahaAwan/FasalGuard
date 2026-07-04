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
          <div className="back-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => router.back()}>
            <ArrowLeft color="#fff" size={20} />
          </div>
          <div className="screen-title">
            {isRTL ? (
              <span className="text-xl font-bold leading-relaxed">قریبی دکانیں</span>
            ) : (
              <span className="text-base font-normal">Nearby Dealers</span>
            )}
          </div>
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
              <span>
                {isRTL ? (
                  <span className="text-xl font-bold leading-relaxed">نقشہ لوڈ ہو رہا ہے...</span>
                ) : (
                  <span className="text-base font-normal">Loading map...</span>
                )}
              </span>
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
                  <div className="dealer-name">
                    {isRTL ? (
                      <span className="text-xl font-bold leading-relaxed">{dealer.name_ur}</span>
                    ) : (
                      <span className="text-base font-normal">{dealer.name}</span>
                    )}
                  </div>
                  <div className="dealer-addr">
                    {isRTL ? (
                      <span className="text-xl font-bold leading-relaxed">{dealer.address_ur}</span>
                    ) : (
                      <span className="text-base font-normal">{dealer.address}</span>
                    )}
                  </div>
                  <div className="dealer-dist">{dealer.distance_km} km away</div>
                </div>
                <div className="dealer-actions">
                  <div className="dealer-action-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => window.location.href = `tel:${dealer.phone}`}>
                    <Phone size={18} />
                  </div>
                  <div className="dealer-action-btn min-h-[48px] min-w-[48px] flex items-center justify-center p-3" onClick={() => window.open(`https://maps.google.com/?q=${dealer.lat},${dealer.lng}`)}>
                    <Navigation size={18} />
                  </div>
                </div>
              </div>
            ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-center mt-10">
                <svg className="w-24 h-24 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  {isRTL ? 'کوئی ریکارڈ نہیں ملا' : 'No records found'}
                </h3>
                <p className="text-base">
                  {isRTL ? 'اپنا پہلا سکین شروع کریں!' : 'Let\'s start your first scan!'}
                </p>
              </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
