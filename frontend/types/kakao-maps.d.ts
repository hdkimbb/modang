declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    extend(latlng: LatLng): void;
  }

  interface MapOptions {
    center: LatLng;
    level: number;
    draggable?: boolean;
    scrollwheel?: boolean;
    disableDoubleClick?: boolean;
    disableDoubleClickZoom?: boolean;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    getLevel(): number;
    setLevel(level: number, options?: { animate?: boolean }): void;
    setBounds(
      bounds: LatLngBounds,
      paddingTop?: number,
      paddingRight?: number,
      paddingBottom?: number,
      paddingLeft?: number,
    ): void;
    relayout(): void;
  }

  interface MarkerOptions {
    map?: Map;
    position: LatLng;
    title?: string;
    clickable?: boolean;
    image?: MarkerImage;
    zIndex?: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    setPosition(position: LatLng): void;
    setImage(image: MarkerImage): void;
    setZIndex(zIndex: number): void;
  }

  class MarkerImage {
    constructor(
      src: string,
      size: Size,
      options?: { offset?: Point; alt?: string },
    );
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    removable?: boolean;
    zIndex?: number;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    setContent(content: string | HTMLElement): void;
    open(map: Map, marker: Marker): void;
    close(): void;
  }

  namespace event {
    function addListener(
      target: Marker | Map,
      type: string,
      handler: () => void,
    ): void;
    function removeListener(
      target: Marker | Map,
      type: string,
      handler: () => void,
    ): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao?: {
    maps: typeof kakao.maps;
  };
}
