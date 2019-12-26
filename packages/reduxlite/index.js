import { getStore } from "./store";

/* eslint-env browser */
/* eslint-disable no-underscore-dangle */

export default (initialState = {}, { dbName = "@pp", devmode = false, devtools = null } = {}) => {
	const store = getStore(initialState, {
		dbName,
		devmode,
		devtools: devtools === true && window.__REDUX_DEVTOOLS_EXTENSION__
			? window.__REDUX_DEVTOOLS_EXTENSION__ : null,
	});

	if (devmode && typeof window !== "undefined") window.store = store;

	return store;
};
