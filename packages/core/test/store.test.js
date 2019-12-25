import { getStore } from "../store";

describe("getStore", () => {
	let store = {};
	beforeEach(() => {
		store = getStore({
			friends: {
				"1": {
					name: "Alice",
				},
				"2": {
					name: "Bob",
				},
			}
		});
	});
	it("stores a flattened version of initialState", () => {
		expect(store.state).toEqual({
			"friends.1.name": "Alice",
			"friends.2.name": "Bob",
		})
	});
	it("dispatch invokes listeners", () => {
		const spy1 = jest.fn();
		const spy2 = jest.fn();
		store.watch("friends.1.name", spy1);
		store.watch("friends.1.name", spy2);
		store.dispatch({
			friends: {
				"1": {
					name: "Carrol",
				}
			}
		});
		expect(spy1).toHaveBeenCalled();
		expect(spy2).toHaveBeenCalled();
	});
	it("can unwatch previously watched", () => {
		const spy1 = jest.fn();
		store.watch("friends.1.name", spy1);
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
					name: "Dianne",
				}
			}
		});
		store.unwatch("friends.1.name", spy1);
		store.dispatch({
			friends: {
				"1": {
					name: "Ed",
				}
			}
		});
		expect(spy1.mock.calls).toEqual([
			["Carrol"],
			["Dianne"],
		]);
	});
	it("will notify with derived objects for partial paths", () => {
		const spy1 = jest.fn();
		const spy2 = jest.fn();
		const spy3 = jest.fn();
		store.watch("friends", spy1);
		store.watch("friends.1", spy2);
		store.watch("friends.1.name", spy3);
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
			},
			"2": {
				name: "Bob",
			},
		}]]);
		expect(spy2.mock.calls).toEqual([[{
			name: "Carrol",
		}]]);
		expect(spy3.mock.calls).toEqual([[
			"Carrol",
		]]);
	});
});
