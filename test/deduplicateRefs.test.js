import { expect } from 'chai';
import { deduplicateRefs, normalizeContent, prepareTpl, parseAttributes } from '../deduplicateRefs.js';

describe('deduplicateRefs', () => {

	it('should handle multiple duplicates correctly', () => {
		const input = `
A<ref>content</ref>
B<ref>content</ref>
C<ref>content</ref>
`;
		const expected = `
A<ref name="dd:1">content</ref>
B<ref name="dd:1" />
C<ref name="dd:1" />
`;
		expect(deduplicateRefs(input)).to.equal(expected);
	});

	it('should treat different order of parameters as duplicates', () => {
		const input = `
A<ref>{{cite|author=info1|title=info2}}</ref>
B<ref>{{cite|title=info2|author=info1}}</ref>
`;
		const expected = `
A<ref name="dd:1">{{cite|author=info1|title=info2}}</ref>
B<ref name="dd:1" />
`;
		expect(deduplicateRefs(input)).to.equal(expected);
	});

	it('should keep unique refs intact', () => {
		const input = `
<ref>unique content</ref>
<ref>another unique content</ref>
`;
		const expected = input;
		expect(deduplicateRefs(input)).to.equal(expected);
	});

	it('should only assign unique names when needed', () => {
		const input = `
Some text with refs.<ref>abc</ref>
More text.<ref>def</ref>
Even more text.<ref>abc</ref>
`;
		const expected = `
Some text with refs.<ref name="dd:1">abc</ref>
More text.<ref>def</ref>
Even more text.<ref name="dd:1" />
`;
		expect(deduplicateRefs(input)).to.equal(expected);
	});

	it('should skip grouped refs', () => {
		const inputs = [
			`A.<ref>abc</ref> B.<ref group="notes">abc</ref>`,
			`A.<ref name="abc">abc</ref> B.<ref name="abc" group="notes">abc</ref>`,
		];
		for (const input of inputs) {
			const expected = input;
			expect(deduplicateRefs(input)).to.equal(expected);
		}
	});

	it('should keep existing name', () => {
		const input = `
A<ref name="info12">{{cite|author=info1|title=info2}}</ref>
B<ref>{{cite|title=info2|author=info1}}</ref>
`;
		const expected = `
A<ref name="info12">{{cite|author=info1|title=info2}}</ref>
B<ref name="info12" />
`;
		expect(deduplicateRefs(input)).to.equal(expected);
	});
	it('should keep 2nd existing name too', () => {
		const input = `
A<ref>{{cite|author=info1|title=info2}}</ref>
B<ref name="info12">{{cite|title=info2|author=info1}}</ref>
`;
		const expected = `
A<ref name="info12">{{cite|author=info1|title=info2}}</ref>
B<ref name="info12" />
`;
		expect(deduplicateRefs(input)).to.equal(expected);
	});


	it('should handle mixed unique and duplicate refs correctly', () => {
		const input = `
<ref>content1</ref>
<ref>content2</ref>
<ref>unique</ref>
<ref>content1</ref>
<ref>content2</ref>
`;
		const expected = `
<ref name="dd:1">content1</ref>
<ref name="dd:2">content2</ref>
<ref>unique</ref>
<ref name="dd:1" />
<ref name="dd:2" />
`;
		expect(deduplicateRefs(input)).to.equal(expected);
	});
});

describe('prepareTpl', () => {
	it('should normalize and sort parameters', () => {
		const inputs = [
			'{{cite 1 | author=info1|title=info2 }}',
			'{{cite 1 |title=info2| author=info1 }}',
			'{{cite 1 | title=info2 | author = info1 }}',
		] ;
		const expected = { name: '{{cite 1', params: ['author=info1', 'title=info2'] };
		for (let input of inputs) {
			const result = prepareTpl(input);
			expect(result.name).to.equal(expected.name);
			expect(result.params).to.deep.equal(expected.params);
		}
	});
});

describe('normalizeContent', () => {
	it('should keep text as is', () => {
		const inputs = [
			'abc',
			'|title=info2|author=info1',
			'[[abc|def]]',
		] ;
		for (let input of inputs) {
			const result = normalizeContent(input);
			expect(result).to.equal(input);
		}
	});

	it('should normalize and sort parameters in template content', () => {
		const input1 = '{{cite 1 | author=info1|title=info2 }}';
		const input2 = '{{cite 1 | title=info2|author=info1}}';
		expect(normalizeContent(input1)).to.equal(normalizeContent(input2));
	});

	it('should different template names should be different', () => {
		const input1 = '{{cite 1 | author=info1|title=info2 }}';
		const input2 = '{{cite 2 | author=info1|title=info2 }}';
		expect(normalizeContent(input1)).to.not.equal(normalizeContent(input2));
	});

	it('should differentiate templates with different order of unnamed params', () => {
		const input1 = '{{cite|a|b|title=info2|author=info1}}';
		const input2 = '{{cite|b|a|title=info2|author=info1}}';
		expect(normalizeContent(input1)).to.not.equal(normalizeContent(input2));
	});

	it('should handle mixed types of parms', () => {
		var input1,input2;
		
		input1 = '{{cite|a|b|title=info2|author=info1}}';
		input2 = '{{cite|a|b|title=info2|author=info1}}';
		expect(normalizeContent(input1)).to.equal(normalizeContent(input2));

		input1 = '{{cite|a| b |title=info2|author=info1}}';
		input2 = '{{cite| a |b|title=info2|author=info1}}';
		expect(normalizeContent(input1)).to.equal(normalizeContent(input2));

		input1 = '{{cite|a|b|title=info2|author=info1}}';
		input2 = '{{cite|a|b|author=info1|title=info2}}';
		expect(normalizeContent(input1)).to.equal(normalizeContent(input2));
	});
});

describe('parseAttributes', () => {
	it('should parse single attribute correctly', () => {
		const input = 'name="xyz"';
		const expected = { name: 'xyz' };
		const result = parseAttributes(input);
		expect(result).to.deep.equal(expected);
	});

	it('should parse multiple attributes correctly', () => {
		const inputs = [
			'name="x" group="notes"',
			'   name="x"    group="notes"  ',
		];
		const expected = { name: 'x', group: 'notes' };
		for (const input of inputs) {
			const result = parseAttributes(input);
			expect(result).to.deep.equal(expected, `Failed for input: ${input}`);
		}
	});

	it('should handle attributes with various quotes', () => {
		const inputs = [
			`name='x' group='notes'`,
			`name="x" group='notes'`,
		];
		const expected = { name: 'x', group: 'notes' };
		for (const input of inputs) {
			const result = parseAttributes(input);
			expect(result).to.deep.equal(expected, `Failed for input: ${input}`);
		}
	});

	it('should handle empty input', () => {
		const inputs = [
			``,
			`  `,
		];
		const expected = {};
		for (const input of inputs) {
			const result = parseAttributes(input);
			expect(result).to.deep.equal(expected, `Failed for input: ${input}`);
		}
	});

	it('should handle malformed names', () => {
		const inputs = [
			`name=xyz`,
			`name=xyz group='notes'`,
		];
		const expected = { name: 'xyz' };
		for (const input of inputs) {
			const result = parseAttributes(input);
			expect(result.name).to.equal(expected.name, `Failed for input: ${input}`);
		}
	});
});
