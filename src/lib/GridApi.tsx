export const xrange = (start: number, stop?:number, step?:number):number[] => {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    var result:number[] = [];
    for (var i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push(i);
    }

    return result;
}

export const CalculateAnimationSpeed = (gameSpeed:number):number => {
    return [1, .75, .5][gameSpeed]
}

export function ConvertRemToPixels(rem:number):number {    
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function CoordinateFromIndex(index:number, height:number):number[] {
  return [index % height, Math.floor(index/height)]
}

export const objectMap = (obj:{}, fn:Function):{} =>
  Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
  )
  