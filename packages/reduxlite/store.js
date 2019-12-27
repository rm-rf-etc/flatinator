import isFunction from "lodash.isfunction";
import keys from "lodash.keys";

export const deleted = Symbol("delete");

export const simpleMerge = (tree, branch) => {
	if (typeof tree === "object") {
		keys(branch).forEach((key) => {
			if (branch[key] === deleted) {
				delete tree[key];
			} else {
				tree[key] = simpleMerge(tree[key], branch[key]);
			}
		});
		return tree;
	}
	return branch;
};

export const partialArray = (pos, thing) => {
	const array = [];
	array[pos] = thing;
	return array;
}

export const createStore = (initialState = {}, { devmode = false } = {}) => ({
	devmode, // a boolean to toggle devmode features
	listeners: new Set(), // a Set of listeners, one added for every call to #watch/2
	stateTree: initialState, // plain object for state, in flattened form (every key is a path)

	watch(selector, handler) {
		if (!isFunction(selector)) throw new Error("watch method expects a function for selector");
		if (!isFunction(handler)) throw new Error("watch method expects a function for handler");
		if (Array.from(this.listeners).some((lisnr) => lisnr.selector === selector)) {
			throw new Error("watch() invoked with selector that's already in use, selectors must be unique per listener");
		}

		const snapshot = selector(this.stateTree);
		this.listeners.add({
			snapshot,
			selector,
			handler,
		});
		return snapshot;
	},

	unwatch(selector, handler) {
		if (!isFunction(selector)) throw new Error("watch method expects a function for selector");
		if (!isFunction(handler)) throw new Error("watch method expects a function for handler");

		Array.from(this.listeners).some((lisnr) => {
			if (lisnr.selector === selector) {
				this.listeners.delete(lisnr);
				return true;
			}
			return false;
		});
	},

	dispatch(branch) {
		this.listeners.forEach((lisnr) => {
			let changed;
			try {
				changed = lisnr.selector(branch);
			} catch (_) {
				return;
			}
			lisnr.snapshot = simpleMerge(lisnr.snapshot, changed);
			lisnr.handler(lisnr.snapshot);
		});
		Promise.resolve().then(() => {
			simpleMerge(this.stateTree, branch);
		});
	},

	// connect(_buckets, _devtools) {
	// 	// [].concat(buckets).map((b) => b.connectDevTools(devtools));
	// },

	// table(bucketName, fields) {
	// 	if (!store.db) return null;

	// 	const identity = Symbol.for(bucketName);
	// 	validIdentity(identity);

	// 	let fieldString = "++id";

	// 	if (isObject(fields)) {
	// 		fieldString += "," + map(fields, (_, key) => key)
	// 			.filter(a => !/^+{0,2}id$/.test(a))
	// 			.join();
	// 	}

	// 	return store.db.version(1).stores({
	// 		[identity.description]: fieldString,
	// 	});
	// },
});
