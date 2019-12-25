import { getStore } from "./store";

/* eslint no-undef: "error" */
/* eslint-env browser */

export default ({
	dbName = "@pp",
	devmode = false,
	devtools = null,
}) => {
	const tank = getStore({
		dbName,
		devmode,
		/* eslint-disable no-underscore-dangle */
		devtools: devtools === true && window.__REDUX_DEVTOOLS_EXTENSION__
			? window.__REDUX_DEVTOOLS_EXTENSION__ : null,
		/* eslint-enable */
	});

	if (devmode && typeof window !== "undefined") window.tank = tank;

	return tank;
};
