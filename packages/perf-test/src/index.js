import { createStore } from "redux";
import createStoreRL from "reduxlite";

// REDUX

function testRedux() {
	const reducer = (oldState = { thing1: 1 }, action = {}) => {
		return {
			...oldState,
			thing1: action.value,
		};
	};
	const store = createStore(reducer, { thing1: 1 });

	console.time("Redux");
	for (var i = 1; i < 100000; i++) {
		store.dispatch({ type: "A", value: i });
	}
	console.timeEnd("Redux");
}

// REDUXLITE

function testReduxLite() {
	const store = createStoreRL({ thing1: 1 });

	console.time("ReduxLite");
	for (var i = 1; i < 100000; i++) {
		store.dispatch({ thing1: i });
	}
	console.timeEnd("ReduxLite");
}

testRedux();
testReduxLite();
