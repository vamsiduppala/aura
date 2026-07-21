// Minimal type shim for the slice of `astronomia` (v4) we use. The library ships
// no declarations. Angles are radians unless noted; longitudes wrap at 2π.

declare module 'astronomia' {
  export namespace solar {
    export function apparentVSOP87(earth: planetposition.Planet, jde: number): { lon: number; lat: number; range: number };
    export function apparentLongitude(T: number): number;
  }
  export namespace moonposition {
    export function position(jde: number): { lon: number; lat: number; range: number };
    export function trueNode(jde: number): number;
    export function node(jde: number): number;
  }
  export namespace planetposition {
    export class Planet {
      constructor(data: unknown);
      position(jde: number): { lon: number; lat: number; range: number };
    }
  }
  export namespace elliptic {
    export function position(planet: planetposition.Planet, earth: planetposition.Planet, jde: number): { ra: number; dec: number };
  }
  export namespace coord {
    export class Equatorial {
      constructor(ra: number, dec: number);
      toEcliptic(epsilon: number): { lon: number; lat: number };
    }
  }
  export namespace nutation {
    export function meanObliquity(jde: number): number;
    export function nutation(jde: number): [number, number];
  }
  export namespace sidereal {
    export function mean(jd: number): number;
    export function apparent(jd: number): number;
  }
  export namespace julian {
    export function CalendarGregorianToJD(y: number, m: number, d: number): number;
  }
  export namespace deltat {
    export function deltaT(year: number): number;
  }
}

declare module 'astronomia/data/vsop87Bearth' { const d: unknown; export default d; }
declare module 'astronomia/data/vsop87Bmars' { const d: unknown; export default d; }
declare module 'astronomia/data/vsop87Bmercury' { const d: unknown; export default d; }
declare module 'astronomia/data/vsop87Bjupiter' { const d: unknown; export default d; }
declare module 'astronomia/data/vsop87Bvenus' { const d: unknown; export default d; }
declare module 'astronomia/data/vsop87Bsaturn' { const d: unknown; export default d; }
