import * as redux from "redux";
import * as reduxlite from "../store";

const repeats = 100000;

describe("Redux Performance", () => {
	const reducer = (oldState = { thing1: 1 }, action = {}) => {
		return {
			...oldState,
			a: {
				thing1: action.value + 1,
				thing2: -(action.value + 1),
			},
		};
	};
	const store = redux.createStore(reducer, {
		a: {
			thing1: 1,
			thing2: -1,
			thing3: "ignored",
		},
		b: {
			ignored: "asdf",
		},
	});

	it(`run dispatch ${(repeats).toLocaleString()} times`, (done) => {
		store.subscribe(() => {
			const state = store.getState();
			if (state && state.a.thing1 === repeats) done();
		});
		for (var i = 0; i < repeats; i++) {
			store.dispatch({ type: "A", value: i });
		}
	});
});

describe("ReduxLite Performance", () => {
	let store = reduxlite.createStore({
		a: [
			{
				thing1: 1,
				thing2: -1,
				thing3: "ignored",
			},
		],
		b: {
			ignored: "asdf",
		},
	});

	it(`run dispatch ${(repeats).toLocaleString()} times`, (done) => {
		store.watch((state) => state.a[0], (state) => {
			if (state.thing1 === repeats) {
				done();
			}
		});
		for (var i = 0; i < repeats; i++) {
			store.dispatch({
				a: [
					{
						thing1: i+1,
						thing2: -(i+1),
					},
				],
			});
		}
	});
});

describe("createStore", () => {
	let store = {};

	beforeEach(() => {
		store = reduxlite.createStore({
			friends: {
				"1": {
					name: "Alice",
					age: 25,
				},
				"2": {
					name: "Bob",
					age: 28,
				},
			}
		});
	});

	it("dispatch invokes listeners", () => {
		const spy1 = jest.fn();
		const spy2 = jest.fn();
		store.watch((state) => state.friends["1"].name, spy1);
		store.watch((state) => state.friends["1"].name, spy2);
		store.dispatch({
			friends: {
				"1": {
					name: "Carrol",
				},
			},
		});
		expect(spy1).toHaveBeenCalled();
		expect(spy2).toHaveBeenCalled();
	});

	it("should throw when attempting to reuse existing selector", () => {
		const selector = (state) => state.friends["1"];

		expect(() => {
			store.watch(selector, console.log);
			store.watch(selector, console.log);
		}).toThrow();

		expect(store.watch((state) => state.friends["1"], console.log)).toEqual({
			name: "Alice",
			age: 25,
		});
		expect(store.watch((state) => state.friends["1"], console.log)).toEqual({
			name: "Alice",
			age: 25,
		});
	});

	it("can unwatch previously watched", () => {
		const spy1 = jest.fn();
		const selector = (state) => state.friends["1"].name;
		store.watch(selector, spy1);
		store.dispatch({
			friends: {
				"1": {
					name: "Carrol",
				}
			}
		});
		store.dispatch({
			friends: {
				"1": {
					name: "Susan",
				},
			},
		});
		store.dispatch({
			friends: {
				"1": {
					name: "Dianne",
				},
			},
		});
		store.unwatch(selector, spy1);
		store.dispatch({
			friends: {
				"1": {
					name: "Edward",
				}
			}
		});
		expect(spy1.mock.calls).toEqual([
			["Carrol"],
			["Susan"],
			["Dianne"],
		]);
	});

	it("emits nested objects for selectors having a partial path", () => {
		const spy1 = jest.fn();
		const spy2 = jest.fn();
		const spy3 = jest.fn();
		store.watch((state) => state.friends, spy1);
		store.watch((state) => state.friends["1"], spy2);
		store.watch((state) => state.friends["1"].name, spy3);
		store.dispatch({
			friends: {
				"1": {
					name: "Carrol",
				},
			},
		});
		expect(spy1.mock.calls).toEqual([[{
			"1": {
				name: "Carrol",
				age: 25,
			},
			"2": {
				name: "Bob",
				age: 28,
			},
		}]]);
		expect(spy2.mock.calls).toEqual([[{
			name: "Carrol",
			age: 25,
		}]]);
		expect(spy3.mock.calls).toEqual([[
			"Carrol",
		]]);
	});

	it("can remove items from arrays", () => {
		const spy1 = jest.fn();
		store.watch((state) => state.friends, spy1);
		store.dispatch({
			friends: {
				"1": {
					name: "Susan",
					age: 25,
				},
				"2": reduxlite.deleted,
			},
		});
		expect(spy1.mock.calls).toEqual([[{
			"1": {
				name: "Susan",
				age: 25,
			},
		}]]);
		expect(store.stateTree.friends["2"]).toEqual(undefined);
	});

	it("can remove items from objects", () => {
		const spy1 = jest.fn();
		store.watch((state) => state.friends, spy1);
		store.dispatch({
			friends: {
				"1": {
					name: "Susan",
					age: reduxlite.deleted,
				},
				"2": {
					age: reduxlite.deleted,
				}
			},
		});
		expect(spy1.mock.calls).toEqual([[{
			"1": {
				name: "Susan",
			},
			"2": {
				name: "Bob",
			},
		}]]);
		expect(store.stateTree.friends["1"]).toEqual({
			name: "Susan",
		});
		expect(store.stateTree.friends["2"]).toEqual({
			name: "Bob",
		});
	});
});

describe("simpleMerge", () => {
	const target = {
		a: [
			{ thing: 1 },
			{ thing: 2 },
		],
		b: {
			asdf1: "!",
			bool: false,
		},
	};

	it("can update simple values in objects in arrays", () => {
		const change = {
			a: reduxlite.partialArray(1, { thing: 3 }),
		};
		expect(change.a[1].thing).toEqual(3);
		expect(target.a[1].thing).toEqual(2);

		const result = { ...target };
		reduxlite.simpleMerge(result, change);
		expect(result.a[1].thing).toEqual(3);
	});

	it("can change simple values to other data types inside nested objects", () => {
		const result = { ...target };
		reduxlite.simpleMerge(result, {
			b: {
				bool: "true",
			},
		});
		expect(result.b.bool).toEqual("true");
	});

	it("can replace simple values in arrays with new objects", () => {
		const result = { ...target };
		reduxlite.simpleMerge(result, {
			a: reduxlite.partialArray(1, {
				thing: {
					new_thing: 1,
				},
			}),
		});
		expect(result.a[1].thing).toEqual({ new_thing: 1 });
	});

	it("can append new items to arrays", () => {
		const result = { ...target };
		reduxlite.simpleMerge(result, {
			a: reduxlite.partialArray(2, {
				thing: "was added",
			}),
		});
		expect(result.a[2]).toEqual({ thing: "was added" });
	});
});
