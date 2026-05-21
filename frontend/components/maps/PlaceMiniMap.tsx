"use client";

import { useEffect, useRef } from "react";

import type { Place } from "@/lib/types/place";

const MINI_MAP_LEVEL = 3;

interface PlaceMiniMapProps {
  place: Place;
  active: boolean;
}

export function PlaceMiniMap({ place, active }: PlaceMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerRef = useRef<kakao.maps.Marker | null>(null);

  useEffect(() => {
    if (!active) {
      mapRef.current = null;
      markerRef.current = null;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
    if (!kakaoKey || kakaoKey === "내가_나중에_입력") return;

    let cancelled = false;

    const init = () => {
      if (cancelled || !window.kakao?.maps || !containerRef.current) return;
      const { maps } = window.kakao;

      maps.load(() => {
        if (cancelled || !containerRef.current) return;
        if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;

        const position = new maps.LatLng(place.lat, place.lng);
        const map = new maps.Map(containerRef.current, {
          center: position,
          level: MINI_MAP_LEVEL,
          draggable: false,
          scrollwheel: false,
          disableDoubleClick: true,
          disableDoubleClickZoom: true,
        });

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
          <path fill="#ff6f0f" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/>
          <circle fill="#fff" cx="14" cy="14" r="5"/>
        </svg>`;
        const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        const image = new maps.MarkerImage(
          src,
          new maps.Size(28, 36),
          { offset: new maps.Point(14, 36) },
        );

        const marker = new maps.Marker({
          position,
          image,
          zIndex: 2,
        });
        marker.setMap(map);

        mapRef.current = map;
        markerRef.current = marker;
        map.relayout();
      });
    };

    if (window.kakao?.maps) {
      init();
    } else {
      const timer = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(timer);
          init();
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(timer);
      };
    }

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [active, place.id, place.lat, place.lng]);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
  const keyMissing = !kakaoKey || kakaoKey === "내가_나중에_입력";

  if (keyMissing) {
    return (
      <div className="mx-4 flex h-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
        카카오맵 키를 설정해 주세요
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mx-4 h-48 overflow-hidden rounded-xl bg-gray-100"
      aria-hidden={!active}
    />
  );
}
