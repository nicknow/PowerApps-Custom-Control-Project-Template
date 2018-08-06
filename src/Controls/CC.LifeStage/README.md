# CC.LifeStage

CC.LifeStage control renders widget for Option Set property.

Control expects these options set items:
```javascript
[{
	name: "Family and Career Building Years",
	val: "100000001",
},
{
	name: "Planning for Retirement",
	val: "100000002",
},
{
	name: "Post Secondary and Early Career Years",
	val: "100000000",
},
{
	name: "Retired",
	val: "100000003",
}]
```

Control will render second level based on property value:

```javascript

{
	name: "Family and Career Building Years",
	val: "100000001",
	mention: [
		"Small Business Banking", "Debt Consolidation", "Home & Life Insurance Products"
	]
},
{
	name: "Planning for Retirement",
	val: "100000002",
	mention: [
		"Small Business Banking", "Debt Consolidation"
	]
},
{
	name: "Post Secondary and Early Career Years",
	val: "100000000",
	mention: [
		"Credit Services", "Financial Planning"
	]
},
{
	name: "Retired",
	val: "100000003",
	mention: [
		"Estate Planning", "Optimizing Taxes"
	]
}

```