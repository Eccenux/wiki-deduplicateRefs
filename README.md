README.md
# deduplicate-refs

A module to deduplicate citations in `<ref>` tags in wikitext.

Duplicate ref is a tag that:
1. Contains the same url (exactly the same url).
2. Have the same contents.
3. Have the same site parameters (in whatever order). So when split by pipe, trimmed, joined and ordered and joined again have the same contents.

## Installation

```bash
npm install deduplicate-refs
```

## Usage

```javascript
const deduplicateRefs = require('deduplicate-refs');

var text = `
Some text with refs.<ref>{{cite|url=https://example.com|content1|content2}}</ref>
More text.<ref>{{cite|url=https://example.com|content2|content1}}</ref>
Even more text.<ref>{{cite|url=https://example.com|content2|content1}}</ref>
`;
var deduplicatedText = deduplicateRefs(text);
console.log(deduplicatedText);
```

## Tests

To run tests, use the following command:

```bash
npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

Main author: Maciej Nux Jaros.