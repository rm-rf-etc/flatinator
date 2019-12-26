# Flattor

Convert nested objects to flattened objects, and back again.

```javascript
// nested object
{
	a: {
		b: 1
	},
	c: [
		1,
		"asdf",
		{
			d: true,
		}
	]
}
// flattened object
{
	"a.b": 1,
	"c[0]": 1,
	"c[1]": "asdf",
	"c[2].d" true
}
```

If you need `.`, `[`, or `]` in your keys, you'll have to substitute temporary
characters before using these functions.
