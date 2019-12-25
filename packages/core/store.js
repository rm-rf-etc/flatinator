import isString from "lodash.isstring";
import isFunction from "lodash.isfunction";
import isObject from "lodash.isobject";
import forEach from "lodash.foreach";
import { nestFlatten, nestExpand } from "weir.util/nested";

const escaped = (str) => str.replace(/(\.|\[|\])/g, "\$1");

export const getStore = (initialState = {}, { devmode = false } = {}) => ({
	// a boolean to toggle devmode features
	devmode,
	// a Set of listeners, one added for every call to #watch/2
	listeners: new Set(),
	// plain object for state, in flattened form (every key is a path)
	state: nestFlatten(initialState),

	watch(path, handler) {
		if (!isString(path)) throw new Error("watch method expects a string for path");
		if (!isFunction(handler)) throw new Error("watch method expects a function for handler");

		const escapedPath = escaped(path);
		this.listeners.add({
			pattern: new RegExp(`^${escapedPath}`),
			patternNested: new RegExp(`^${escapedPath}[\.\[](.+)$`),
			handler,
			path,
		});
	},

	unwatch(path, handler) {
		if (!isString(path)) throw new Error("watch method expects a string for path");
		if (!isFunction(handler)) throw new Error("watch method expects a function for handler");

		const toRemove = new Set();
		this.listeners.forEach((listener) => {
			if (listener.pattern.test(path)) {
				toRemove.add(listener);
			}
		});
		toRemove.forEach((listener) => this.listeners.delete(listener));
	},

	dispatch(branch) {
		if (!isObject(branch)) throw new Error("update expects an object for branch");

		forEach(nestFlatten(branch), (value, dispatchedPath) => {
			// First update the state.
			this.state[dispatchedPath] = value;

			// Next look for any listeners at any level of the tree.
			this.listeners.forEach(({ path, patternNested, handler }) => {
				// If simple exact match then callback with value.
				if (dispatchedPath === path) return handler(value);

				// If matched at a lower level of the tree,
				if (patternNested.test(dispatchedPath)) {

					const result = {};
					// ...loop over every path in our state,
					forEach(this.state, (value, key) => {

						// ...and if it matches,
						const match = key.match(patternNested);

						// ...add the the child path and value to our new result,
						if (match) result[match[1]] = value;
					});

					// ...then callback with the expanded child branches.
					return handler(nestExpand(result));
				}
			});
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
