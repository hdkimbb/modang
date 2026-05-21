"use client";

import { useEffect, useRef, useState } from "react";

import type { Place } from "@/lib/types/place";

const DEFAULT_CENTER = { lat: 37.4979, lng: 127.0276 };
const FOCUS_LEVEL = 4;
const FEW_RESULTS_LEVEL = 5;
const MIN_BOUNDS_LEVEL = 7;
const MAP_PADDING = 48;

const PIN_DEFAULT = "#c4c9d0";
const PIN_LIGHT = "#ffb380";
const PIN_SELECTED = "#ff6f0f";

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function placesWithCoords(places: Place[]): Place[] {
  return places.filter((p) => isValidCoord(p.lat, p.lng));
}

/** Avoid nationwide setBounds when Kakao returns scattered results. */
function placesForInitialBounds(places: Place[]): Place[] {
  const valid = placesWithCoords(places);
  if (valid.length <= 2) return valid;

  const anchor = valid[0];
  const nearby = valid.filter(
    (p) =>
      Math.abs(p.lat - anchor.lat) < 0.45 &&
      Math.abs(p.lng - anchor.lng) < 0.55,
  );

  if (nearby.length >= 2) return nearby;
  return valid.slice(0, Math.min(12, valid.length));
}

function markerImageSrc(fill: string, width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 28 36">
    <path fill="${fill}" d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z"/>
    <circle fill="#fff" cx="14" cy="14" r="5"/>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function createMarkerImage(
  maps: typeof kakao.maps,
  color: string,
  width: number,
  height: number,
): kakao.maps.MarkerImage {
  return new maps.MarkerImage(
    markerImageSrc(color, width, height),
    new maps.Size(width, height),
    { offset: new maps.Point(width / 2, height) },
  );
}

function infoWindowContent(place: Place): string {
  const count =
    place.meetingCount > 0
      ? `<div style="margin-top:4px;font-size:12px;color:#ff6f0f;">모임 ${place.meetingCount}건</div>`
      : "";
  return `<div style="padding:6px 8px;font-size:13px;line-height:1.35;white-space:nowrap;">
    <strong>${place.name}</strong>${count}
  </div>`;
}

interface KakaoMapProps {
  places: Place[];
  selectedPlace: Place | null;
  fitAllKey: number;
  onPlaceClick: (place: Place) => void;
}

export function KakaoMap({
  places,
  selectedPlace,
  fitAllKey,
  onPlaceClick,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersByIdRef = useRef<Map<string, kakao.maps.Marker>>(new Map());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const onPlaceClickRef = useRef(onPlaceClick);
  const fitAllKeyRef = useRef(fitAllKey);
  const selectedIdRef = useRef<string | null>(null);

  onPlaceClickRef.current = onPlaceClick;

  const focusPlace = (
    map: kakao.maps.Map,
    maps: typeof kakao.maps,
    place: Place,
  ) => {
    const pos = new maps.LatLng(place.lat, place.lng);
    map.panTo(pos);
    map.setLevel(FOCUS_LEVEL, { animate: true });
  };

  const fitAllPlaces = (map: kakao.maps.Map, maps: typeof kakao.maps) => {
    const target = placesForInitialBounds(places);
    if (target.length === 0) {
      map.setCenter(
        new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      );
      map.setLevel(FEW_RESULTS_LEVEL);
      return;
    }

    if (target.length <= 2) {
      const p = target[0];
      map.setCenter(new maps.LatLng(p.lat, p.lng));
      map.setLevel(FEW_RESULTS_LEVEL);
      return;
    }

    const bounds = new maps.LatLngBounds();
    target.forEach((place) => {
      bounds.extend(new maps.LatLng(place.lat, place.lng));
    });
    map.setBounds(bounds, MAP_PADDING, MAP_PADDING, MAP_PADDING, MAP_PADDING);

    if (map.getLevel() < MIN_BOUNDS_LEVEL) {
      const center = target[0];
      map.setCenter(new maps.LatLng(center.lat, center.lng));
      map.setLevel(MIN_BOUNDS_LEVEL);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
    if (!kakaoKey || kakaoKey === "내가_나중에_입력") return;

    let cancelled = false;

    const init = () => {
      if (cancelled || !window.kakao?.maps) return;
      const { maps } = window.kakao;

      maps.load(() => {
        if (cancelled || !containerRef.current) return;

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: FEW_RESULTS_LEVEL,
        });
        mapRef.current = map;
        infoWindowRef.current = new maps.InfoWindow({ removable: false });
        map.relayout();
        setMapReady(true);
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
      setMapReady(false);
      mapRef.current = null;
      markersByIdRef.current.clear();
      infoWindowRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;
    if (!mapReady || !map || !kakaoMaps) return;

    const defaultImage = createMarkerImage(kakaoMaps, PIN_DEFAULT, 24, 31);
    const lightImage = createMarkerImage(kakaoMaps, PIN_LIGHT, 26, 34);
    const selectedImage = createMarkerImage(kakaoMaps, PIN_SELECTED, 32, 41);

    markersByIdRef.current.forEach((marker) => marker.setMap(null));
    markersByIdRef.current.clear();
    infoWindowRef.current?.close();

    const coordPlaces = placesWithCoords(places);

    coordPlaces.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const hasMeetings = place.meetingCount > 0;
      const image = isSelected
        ? selectedImage
        : hasMeetings
          ? lightImage
          : defaultImage;

      const marker = new kakaoMaps.Marker({
        position: new kakaoMaps.LatLng(place.lat, place.lng),
        title: place.name,
        image,
        zIndex: isSelected ? 3 : hasMeetings ? 2 : 1,
      });
      marker.setMap(map);
      kakaoMaps.event.addListener(marker, "click", () => {
        onPlaceClickRef.current(place);
      });
      markersByIdRef.current.set(place.id, marker);

      if (isSelected && infoWindowRef.current) {
        infoWindowRef.current.setContent(infoWindowContent(place));
        infoWindowRef.current.open(map, marker);
      }
    });
  }, [places, selectedPlace, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const kakaoMaps = window.kakao?.maps;
    if (!mapReady || !map || !kakaoMaps) return;

    if (fitAllKeyRef.current !== fitAllKey) {
      fitAllKeyRef.current = fitAllKey;
      selectedIdRef.current = null;
      fitAllPlaces(map, kakaoMaps);
      return;
    }

    const selectedId = selectedPlace?.id ?? null;
    if (selectedId && selectedId !== selectedIdRef.current && selectedPlace) {
      selectedIdRef.current = selectedId;
      if (isValidCoord(selectedPlace.lat, selectedPlace.lng)) {
        focusPlace(map, kakaoMaps, selectedPlace);
      }
    }
  }, [fitAllKey, selectedPlace, mapReady, places]);

  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
  const keyMissing = !kakaoKey || kakaoKey === "내가_나중에_입력";

  if (keyMissing) {
    return (
      <div
        className="flex items-center justify-center bg-neutral-100"
        style={{
          height: "40vh",
          minHeight: 200,
          fontSize: "var(--seed-font-size-t4)",
          color: "var(--seed-color-fg-neutral-subtle)",
        }}
      >
        카카오맵 키를 .env.local에 설정해 주세요.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "40vh", minHeight: 200 }}
      aria-label="장소 지도"
    />
  );
}
