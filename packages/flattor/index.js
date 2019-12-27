import isPlainObject from "lodash.isplainobject";
import isBoolean from "lodash.isboolean";
import isString from "lodash.isstring";
import isNumber from "lodash.isnumber";
import entries from "lodash.topairs";
import merge from "lodash.merge";
import keys from "lodash.keys";

const { isArray } = Array;
const isPrimitive = (x) => isString(x) || isNumber(x) || isBoolean(x);

export const getPath = (src, curPath, nextProp) => {
    let pathNow = null;
    if (nextProp) {
        if (curPath) {
            pathNow = isArray(src) ? `${curPath}[${nextProp}]` : `${curPath}.${nextProp}`;
        } else {
            pathNow = isArray(src) ? `[${nextProp}]` : nextProp;
        }
    }
    return pathNow;
};

export const segmentsFromPath = (path) => {
    const segments = [''];
    let l = 0;
    for(let r = 0; r < path.length; r++) {
        if (path[r] === '[') {
            l++;
            segments[l] = '[';
        }
        else if (path[r] !== '.') {
            segments[l] += path[r];
        } else {
            l++;
            segments[l] = '';
        }
    }
    return segments;
}

export const branchExpand = (path, leaf) => {
    const segments = [];
    let isOb = true;
    let thing = {};
    let prop = '';
    for(let r = 0; r < path.length; r++) {
        switch(path[r]) {
            case ']': {
                segments[segments.length] = { thing, prop: isOb ? prop : +prop };
                prop = '';
                break;
            }
            case '.': {
                if (isOb) {
                    segments[segments.length] = { thing, prop };
                } else {
                    isOb = true;
                }
                thing = {};
                prop = '';
                break;
            }
            case '[': {
                if (prop) {
                    segments[segments.length] = { thing, prop };
                }
                thing = [];
                isOb = false;
                prop = '';
                break;
            }
            default: prop += path[r];
        }
    }
    if (isOb) {
        segments[segments.length] = { thing, prop: isOb ? prop : +prop };
    }

    let branch;
    let last = leaf;
    for (let i = segments.length - 1; i > -1; i--) {
        branch = segments[i].thing;
        branch[segments[i].prop] = last;
        last = branch;
    }
    return last;
};

export const nestFlatten = (src, curPath) => {
    const result = {};
    keys(src).forEach((propKey) => {
        const newPath = getPath(src, curPath, propKey);
        const nextSrc = src[propKey];

        if (isPrimitive(nextSrc) || (!isPlainObject(nextSrc) && !isArray(nextSrc))) {
            result[newPath] = nextSrc;
        } else {
            merge(result, nestFlatten(nextSrc, newPath));
        }
    });
    return result;
};

export const nestExpand = (src) => {
    let result = [];
    const branches = [];

    keys(src).forEach((key) => {
        if (key[0] !== '[') {
            result = {};
        }
        branches[branches.length] = branchExpand(key, src[key]);
    });
    branches.forEach((branch) => merge(result, branch));

    return result;
};

export const arrayPartial = (pos, thing) => {
    const arr = [];
    arr[pos] = thing;
    return arr;
};
