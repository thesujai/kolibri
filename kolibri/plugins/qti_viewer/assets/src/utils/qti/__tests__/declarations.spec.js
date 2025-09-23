/**
 * Unit tests for QTI variable declarations
 * Tests the parsing and validation of QTI variable declarations
 */

import { QTIVariable, areTypesCompatible, areDeclarationsCompatible } from '../declarations';
import { BASE_TYPE } from '../values';

const parser = new DOMParser();

// Helper function to create QTIVariable from XML string
function createDeclaration(xmlString) {
  const doc = parser.parseFromString(xmlString, 'text/xml');
  return new QTIVariable(doc.documentElement);
}

describe('QTIVariable', () => {
  test('should parse basic response declaration', () => {
    const xmlString =
      '<qti-response-declaration identifier="SCORE" base-type="integer" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.identifier).toBe('SCORE');
    expect(declaration.baseType).toBe('integer');
    expect(declaration.cardinality).toBe('single');
  });

  test('should parse declaration with default value', () => {
    const xmlString = `
      <qti-response-declaration identifier="SCORE" base-type="integer" cardinality="single">
        <qti-default-value>
          <qti-value>50</qti-value>
        </qti-default-value>
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.defaultValue).toBe(50);
  });

  test('should parse declaration with correct response', () => {
    const xmlString = `
      <qti-response-declaration identifier="CHOICE" base-type="identifier" cardinality="single">
        <qti-correct-response>
          <qti-value>A</qti-value>
        </qti-correct-response>
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.correctResponse).toBe('A');
  });

  test('should parse multiple values for multiple cardinality', () => {
    const xmlString = `
      <qti-response-declaration identifier="MULTI" base-type="identifier" cardinality="multiple">
        <qti-correct-response>
          <qti-value>A</qti-value>
          <qti-value>B</qti-value>
          <qti-value>C</qti-value>
        </qti-correct-response>
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.correctResponse).toEqual(['A', 'B', 'C']);
  });

  test('should validate compatible types', () => {
    // Numeric types should be compatible
    expect(areTypesCompatible('integer', 'float')).toBe(true);
    expect(areTypesCompatible('float', 'integer')).toBe(true);

    // Same types should be compatible
    expect(areTypesCompatible('string', 'string')).toBe(true);

    // Different non-numeric types should not be compatible
    expect(areTypesCompatible('string', 'boolean')).toBe(false);
  });

  test('should validate value compatibility', () => {
    const xmlString =
      '<qti-response-declaration identifier="SCORE" base-type="integer" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    // Valid values
    expect(declaration.isValueCompatible(42)).toBe(true);
    expect(declaration.isValueCompatible(null)).toBe(true);

    // Invalid values
    expect(declaration.isValueCompatible('not a number')).toBe(false);
    expect(declaration.isValueCompatible([1, 2, 3])).toBe(false); // Array for single cardinality
  });

  test('should parse boolean values correctly', () => {
    const xmlString = `
      <qti-response-declaration identifier="FLAG" base-type="boolean" cardinality="single">
        <qti-default-value>
          <qti-value>true</qti-value>
        </qti-default-value>
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.defaultValue).toBe(true);
    expect(typeof declaration.defaultValue).toBe('boolean');
  });

  test('should parse ordered cardinality values', () => {
    const xmlString = `
      <qti-response-declaration identifier="ORDERED_LIST" base-type="identifier" cardinality="ordered">
        <qti-correct-response>
          <qti-value>First</qti-value>
          <qti-value>Second</qti-value>
          <qti-value>Third</qti-value>
        </qti-correct-response>
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.correctResponse).toEqual(['First', 'Second', 'Third']);
    expect(declaration.cardinality).toBe('ordered');
  });

  test('should parse mapping with map entries', () => {
    const xmlString = `
      <qti-response-declaration identifier="MAPPED" base-type="identifier" cardinality="single">
        <qti-mapping default-value="0">
          <qti-map-entry map-key="CHOICE_A" mapped-value="1" />
          <qti-map-entry map-key="CHOICE_B" mapped-value="2" />
          <qti-map-entry map-key="CHOICE_C" mapped-value="3" />
        </qti-mapping>
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.mapping).toBeDefined();
    expect(declaration.mapping.defaultValue).toBe(0);
    expect(declaration.mapping.entries.get('CHOICE_A').mappedValue).toBe(1);
    expect(declaration.mapping.entries.get('CHOICE_B').mappedValue).toBe(2);
    expect(declaration.mapping.entries.get('CHOICE_C').mappedValue).toBe(3);
  });

  test('should parse area mapping', () => {
    const xmlString = `
      <qti-response-declaration identifier="HOTSPOT" base-type="point" cardinality="single">
        <qti-area-mapping default-value="0" />
      </qti-response-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.areaMapping).toBeDefined();
    expect(declaration.areaMapping.defaultValue).toBe(0);
  });

  test('should validate point values', () => {
    const xmlString =
      '<qti-response-declaration identifier="POINT" base-type="point" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.isValueCompatible([10, 20])).toBe(true);
    expect(declaration.isValueCompatible([0, 0])).toBe(true);
    expect(declaration.isValueCompatible([10])).toBe(false); // Wrong length
    expect(declaration.isValueCompatible('not a point')).toBe(false);
  });

  test('should validate pair values', () => {
    const xmlString =
      '<qti-response-declaration identifier="PAIR" base-type="pair" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.isValueCompatible(['A', 'B'])).toBe(true);
    expect(declaration.isValueCompatible(['X', 'Y'])).toBe(true);
    expect(declaration.isValueCompatible(['A'])).toBe(false); // Wrong length
    expect(declaration.isValueCompatible('not a pair')).toBe(false);
  });

  test('should validate directed pair values', () => {
    const xmlString =
      '<qti-response-declaration identifier="DIRECTED" base-type="directedPair" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.isValueCompatible(['A', 'B'])).toBe(true);
    expect(declaration.isValueCompatible(['X', 'Y'])).toBe(true);
    expect(declaration.isValueCompatible(['A'])).toBe(false); // Wrong length
    expect(declaration.isValueCompatible('not a directed pair')).toBe(false);
  });

  test('should validate duration values', () => {
    const xmlString =
      '<qti-response-declaration identifier="TIME" base-type="duration" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.isValueCompatible(3600)).toBe(true); // 1 hour
    expect(declaration.isValueCompatible(0)).toBe(true); // 0 seconds
    expect(declaration.isValueCompatible(-10)).toBe(false); // Negative duration
    expect(declaration.isValueCompatible('not a duration')).toBe(false);
  });

  test('should validate file values', () => {
    const xmlString =
      '<qti-response-declaration identifier="UPLOAD" base-type="file" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    expect(declaration.isValueCompatible(file)).toBe(true);

    expect(declaration.isValueCompatible({ data: 'content', mimeType: 'text/plain' })).toBe(false);
    expect(declaration.isValueCompatible('not a file')).toBe(false);
    expect(declaration.isValueCompatible(123)).toBe(false);
  });

  test('should validate float values correctly', () => {
    const xmlString =
      '<qti-response-declaration identifier="DECIMAL" base-type="float" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.isValueCompatible(3.14)).toBe(true);
    expect(declaration.isValueCompatible(0.5)).toBe(true);
    expect(declaration.isValueCompatible(42)).toBe(false); // Integer, not float
    expect(declaration.isValueCompatible('not a float')).toBe(false);
  });

  test('should validate URI values', () => {
    const xmlString =
      '<qti-response-declaration identifier="LINK" base-type="uri" cardinality="single" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.isValueCompatible('https://example.com')).toBe(true);
    expect(declaration.isValueCompatible('file:///path/to/file')).toBe(true);
    expect(declaration.isValueCompatible(123)).toBe(false);
    expect(declaration.isValueCompatible(true)).toBe(false);
  });

  test('should validate record cardinality with no field declarations', () => {
    const xmlString =
      '<qti-response-declaration identifier="RECORD" base-type="string" cardinality="record" />';
    const declaration = createDeclaration(xmlString);

    expect(declaration.cardinality).toBe('record');
    expect(declaration.fieldDeclarations).toBe(null); // No field declarations defined

    // Without field declarations, records should reject any non-empty objects
    expect(declaration.isValueCompatible({})).toBe(true); // Empty object is valid
    expect(declaration.isValueCompatible({ key1: 'value1' })).toBe(false); // No field declarations
    expect(declaration.isValueCompatible('single value')).toBe(false); // Not an object
    expect(declaration.isValueCompatible(['array', 'value'])).toBe(false); // Array is not valid for record
    expect(declaration.isValueCompatible(null)).toBe(true); // Null is always compatible
  });

  test('should check declaration compatibility', () => {
    const intDecl = createDeclaration(
      '<qti-response-declaration identifier="INT" base-type="integer" cardinality="single" />',
    );
    const floatDecl = createDeclaration(
      '<qti-response-declaration identifier="FLOAT" base-type="float" cardinality="single" />',
    );
    const stringDecl = createDeclaration(
      '<qti-response-declaration identifier="STRING" base-type="string" cardinality="single" />',
    );
    const multipleDecl = createDeclaration(
      '<qti-response-declaration identifier="MULTIPLE" base-type="string" cardinality="multiple" />',
    );

    // Compatible numeric types
    expect(areDeclarationsCompatible(intDecl, floatDecl)).toBe(true);
    expect(areDeclarationsCompatible(floatDecl, intDecl)).toBe(true);

    // Same type compatibility
    expect(areDeclarationsCompatible(stringDecl, stringDecl)).toBe(true);

    // Different base types
    expect(areDeclarationsCompatible(intDecl, stringDecl)).toBe(false);
    expect(areDeclarationsCompatible(stringDecl, intDecl)).toBe(false);

    // Different cardinality
    expect(areDeclarationsCompatible(stringDecl, multipleDecl)).toBe(false);
    expect(areDeclarationsCompatible(multipleDecl, stringDecl)).toBe(false);
  });
});

describe('Value coercion methods', () => {
  test('should coerce boolean values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="BOOL" base-type="boolean" cardinality="single" />',
    );

    // String coercion - QTI strict: only "true" and "false" (case sensitive)
    expect(declaration.coerceValue('true')).toBe(true);
    expect(declaration.coerceValue('false')).toBe(false);
    expect(declaration.coerceValue('True')).toBe(false);
    expect(declaration.coerceValue('False')).toBe(false);

    // Boolean passthrough
    expect(declaration.coerceValue(true)).toBe(true);
    expect(declaration.coerceValue(false)).toBe(false);

    // Other types
    expect(declaration.coerceValue(1)).toBe(true);
    expect(declaration.coerceValue(0)).toBe(false);
    expect(declaration.coerceValue('')).toBe(null);
    expect(declaration.coerceValue('anything')).toBe(false);
  });

  test('should coerce integer values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="INT" base-type="integer" cardinality="single" />',
    );

    // String coercion
    expect(declaration.coerceValue('42')).toBe(42);
    expect(declaration.coerceValue('-17')).toBe(-17);
    expect(declaration.coerceValue('3.7')).toBe(3);

    // Number passthrough/conversion
    expect(declaration.coerceValue(42)).toBe(42);
    expect(declaration.coerceValue(3.7)).toBe(3);
    expect(declaration.coerceValue(-17)).toBe(-17);

    // Other types should result in NaN for non-numeric inputs
    expect(declaration.coerceValue(true)).toBeNaN();
    expect(declaration.coerceValue(false)).toBeNaN();
  });

  test('should coerce float values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="FLOAT" base-type="float" cardinality="single" />',
    );

    // String coercion
    expect(declaration.coerceValue('3.14')).toBe(3.14);
    expect(declaration.coerceValue('-2.5')).toBe(-2.5);
    expect(declaration.coerceValue('42')).toBe(42);

    // Number passthrough
    expect(declaration.coerceValue(3.14)).toBe(3.14);
    expect(declaration.coerceValue(42)).toBe(42);

    // Other types should result in NaN for non-numeric inputs
    expect(declaration.coerceValue(true)).toBeNaN();
    expect(declaration.coerceValue(false)).toBeNaN();
  });

  test('should coerce string values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="STR" base-type="string" cardinality="single" />',
    );

    // String passthrough
    expect(declaration.coerceValue('hello')).toBe('hello');
    expect(declaration.coerceValue('')).toBe(null); // Empty string is NULL per QTI spec

    // Other types
    expect(declaration.coerceValue(42)).toBe('42');
    expect(declaration.coerceValue(true)).toBe('true');
    expect(declaration.coerceValue(false)).toBe('false');
    expect(declaration.coerceValue(null)).toBe(null);
  });

  test('should coerce point values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="POINT" base-type="point" cardinality="single" />',
    );

    // Array inputs
    expect(declaration.coerceValue([10, 20])).toEqual([10, 20]);
    expect(declaration.coerceValue(['10', '20'])).toEqual([10, 20]);

    // String coercion
    expect(declaration.coerceValue('10 20')).toEqual([10, 20]);
    expect(declaration.coerceValue('3 -2')).toEqual([3, -2]);

    // Invalid inputs should throw
    expect(() => declaration.coerceValue('invalid')).toThrow('Cannot coerce invalid to point');
    expect(() => declaration.coerceValue('10')).toThrow('Cannot coerce 10 to point');
    expect(() => declaration.coerceValue({ x: 10 })).toThrow(
      'Cannot coerce [object Object] to point',
    );
  });

  test('should coerce pair values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="PAIR" base-type="pair" cardinality="single" />',
    );

    // Array inputs
    expect(declaration.coerceValue(['A', 'B'])).toEqual(['A', 'B']);
    expect(declaration.coerceValue([1, 2])).toEqual(['1', '2']);

    // String coercion
    expect(declaration.coerceValue('A B')).toEqual(['A', 'B']);
    expect(declaration.coerceValue('Choice1 Choice2')).toEqual(['Choice1', 'Choice2']);

    // Invalid inputs should throw
    expect(() => declaration.coerceValue('single')).toThrow('Cannot coerce single to pair');
    expect(() => declaration.coerceValue({ first: 'A' })).toThrow(
      'Cannot coerce [object Object] to pair',
    );
  });

  test('should coerce duration values from multiple input types', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="TIME" base-type="duration" cardinality="single" />',
    );

    // Number passthrough
    expect(declaration.coerceValue(3600)).toBe(3600);
    expect(declaration.coerceValue(0)).toBe(0);

    // String coercion
    expect(declaration.coerceValue('3600')).toBe(3600);
    expect(declaration.coerceValue('3.5')).toBe(3.5);

    // Invalid inputs should throw
    expect(() => declaration.coerceValue(-10)).toThrow('Cannot coerce -10 to duration');
    expect(() => declaration.coerceValue('-5')).toThrow('Cannot coerce -5 to duration');
    expect(() => declaration.coerceValue('invalid')).toThrow('Cannot coerce invalid to duration');
  });

  test('should handle file values without coercion', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="FILE" base-type="file" cardinality="single" />',
    );

    // File objects pass through unchanged
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    expect(declaration.coerceValue(file)).toBe(file);

    // Non-File objects also pass through (validation happens elsewhere)
    const notAFile = { data: 'content', mimeType: 'text/plain' };
    expect(declaration.coerceValue(notAFile)).toBe(notAFile);
    expect(declaration.coerceValue('not a file')).toBe('not a file');
  });

  test('should handle null and undefined values in coercion', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="STR" base-type="string" cardinality="single" />',
    );

    expect(declaration.coerceValue(null)).toBe(null);
    expect(declaration.coerceValue(undefined)).toBe(null);
    expect(declaration.coerceValue('NULL')).toBe(null);
    expect(declaration.coerceValue('')).toBe(null); // Empty string is NULL per QTI spec
  });

  test('should coerce arrays of values correctly', () => {
    const declaration = createDeclaration(
      '<qti-response-declaration identifier="MULTI" base-type="string" cardinality="multiple" />',
    );

    const result = declaration.coerceValue(['hello', 42, true, null]);
    expect(result).toEqual(['hello', '42', 'true', null]);
  });

  test('should coerce single values to arrays for single cardinality', () => {
    const singleDecl = createDeclaration(
      '<qti-response-declaration identifier="SINGLE" base-type="string" cardinality="single" />',
    );
    const multipleDecl = createDeclaration(
      '<qti-response-declaration identifier="MULTIPLE" base-type="string" cardinality="multiple" />',
    );

    expect(singleDecl.coerceValue(['hello'])).toBe('hello');
    expect(multipleDecl.coerceValue(['hello'])).toEqual(['hello']);
    expect(multipleDecl.coerceValue(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
  });

  test('should coerce record cardinality values with no field declarations', () => {
    const recordDecl = createDeclaration(
      '<qti-response-declaration identifier="RECORD" base-type="string" cardinality="record" />',
    );

    // Test that records without field declarations only accept empty objects
    expect(recordDecl.coerceValue({})).toEqual({});

    // Test that non-empty objects are rejected
    expect(() => recordDecl.coerceValue({ key1: 'value1' })).toThrow(
      "Field 'key1' is not defined in record declaration",
    );

    // Test invalid inputs
    expect(() => recordDecl.coerceValue(['key1', 'value1', 'key2', 'value2'])).toThrow(
      'Record cardinality requires a JavaScript object',
    );
    expect(() => recordDecl.coerceValue('invalid')).toThrow(
      'Record cardinality requires a JavaScript object',
    );
  });

  test('should reject record cardinality with different base types when no fields defined', () => {
    const intRecordDecl = createDeclaration(
      '<qti-response-declaration identifier="INT_RECORD" base-type="integer" cardinality="record" />',
    );
    const boolRecordDecl = createDeclaration(
      '<qti-response-declaration identifier="BOOL_RECORD" base-type="boolean" cardinality="record" />',
    );

    // Records without field declarations should reject all non-empty objects
    expect(() => intRecordDecl.coerceValue({ score1: '100' })).toThrow(
      "Field 'score1' is not defined in record declaration",
    );
    expect(() => boolRecordDecl.coerceValue({ flag1: 'true' })).toThrow(
      "Field 'flag1' is not defined in record declaration",
    );
  });

  test('should parse record with field-specific base types', () => {
    const xmlString = `
      <qti-context-declaration cardinality="record" identifier="QTI_CONTEXT">
        <qti-default-value>
          <qti-value base-type="string" field-identifier="candidateIdentifier">Curly</qti-value>
          <qti-value base-type="string" field-identifier="testIdentifier">essay-test</qti-value>
          <qti-value base-type="string" field-identifier="environmentIdentifier">2</qti-value>
          <qti-value base-type="integer" field-identifier="optionalField2">3</qti-value>
        </qti-default-value>
      </qti-context-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.cardinality).toBe('record');
    expect(declaration.fieldDeclarations).toBeDefined();
    expect(declaration.fieldDeclarations.candidateIdentifier.baseType).toBe('string');
    expect(declaration.fieldDeclarations.testIdentifier.baseType).toBe('string');
    expect(declaration.fieldDeclarations.environmentIdentifier.baseType).toBe('string');
    expect(declaration.fieldDeclarations.optionalField2.baseType).toBe('integer');

    expect(declaration.defaultValue).toEqual({
      candidateIdentifier: 'Curly',
      testIdentifier: 'essay-test',
      environmentIdentifier: '2',
      optionalField2: 3,
    });
  });

  test('should strictly validate record with defined field declarations', () => {
    const xmlString = `
      <qti-context-declaration cardinality="record" identifier="QTI_CONTEXT">
        <qti-default-value>
          <qti-value base-type="string" field-identifier="name">Test</qti-value>
          <qti-value base-type="integer" field-identifier="score">100</qti-value>
          <qti-value base-type="boolean" field-identifier="passed">true</qti-value>
        </qti-default-value>
      </qti-context-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    // Valid values matching exactly the defined field specifications
    expect(
      declaration.isValueCompatible({
        name: 'John Doe',
        score: 95,
        passed: true,
      }),
    ).toBe(true);

    // Partial object with only defined fields should be valid
    expect(
      declaration.isValueCompatible({
        name: 'Jane Smith',
        score: 87,
      }),
    ).toBe(true);

    // Invalid values - wrong types for specific fields
    expect(
      declaration.isValueCompatible({
        name: 123, // Should be string
        score: 95,
        passed: true,
      }),
    ).toBe(false);

    expect(
      declaration.isValueCompatible({
        name: 'John Doe',
        score: 'not a number', // Should be integer
        passed: true,
      }),
    ).toBe(false);

    expect(
      declaration.isValueCompatible({
        name: 'John Doe',
        score: 95,
        passed: 'not a boolean', // Should be boolean
      }),
    ).toBe(false);

    // Invalid - field not defined in the declaration
    expect(
      declaration.isValueCompatible({
        name: 'John Doe',
        score: 95,
        undefinedField: 'this field was not declared', // Not in field declarations
      }),
    ).toBe(false);

    // Invalid - array instead of object
    expect(declaration.isValueCompatible(['name', 'John', 'score', 95])).toBe(false);

    // Empty object should be valid (no fields to validate)
    expect(declaration.isValueCompatible({})).toBe(true);
  });

  test('should coerce values strictly using defined field declarations', () => {
    const xmlString = `
      <qti-context-declaration cardinality="record" identifier="QTI_CONTEXT">
        <qti-default-value>
          <qti-value base-type="string" field-identifier="name">Test</qti-value>
          <qti-value base-type="integer" field-identifier="score">100</qti-value>
          <qti-value base-type="boolean" field-identifier="passed">true</qti-value>
        </qti-default-value>
      </qti-context-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    // Test coercion with defined fields only
    expect(
      declaration.coerceValue({
        name: 123, // Will be coerced to string via field declaration
        score: '95', // Will be coerced to integer via field declaration
        passed: 'true', // Will be coerced to boolean via field declaration
      }),
    ).toEqual({
      name: '123',
      score: 95,
      passed: true,
    });

    // Test partial object coercion
    expect(
      declaration.coerceValue({
        name: 789,
        score: '92',
        // passed field omitted - should be fine
      }),
    ).toEqual({
      name: '789',
      score: 92,
    });

    // Test that undefined fields cause errors during coercion
    expect(() =>
      declaration.coerceValue({
        name: 'John',
        score: 95,
        undefinedField: 'this should cause an error',
      }),
    ).toThrow("Field 'undefinedField' is not defined in record declaration");
  });

  test('should handle complex record with multiple cardinality fields', () => {
    const xmlString = `
      <qti-context-declaration cardinality="record" identifier="COMPLEX_RECORD">
        <qti-default-value>
          <qti-value base-type="string" field-identifier="studentName">John</qti-value>
          <qti-value base-type="identifier" field-identifier="selectedChoices" cardinality="multiple">A</qti-value>
          <qti-value base-type="identifier" field-identifier="selectedChoices" cardinality="multiple">C</qti-value>
          <qti-value base-type="point" field-identifier="coordinates">10 20</qti-value>
        </qti-default-value>
      </qti-context-declaration>
    `;
    const declaration = createDeclaration(xmlString);

    expect(declaration.cardinality).toBe('record');
    expect(declaration.fieldDeclarations).toBeDefined();
    expect(declaration.fieldDeclarations.studentName.baseType).toBe('string');
    expect(declaration.fieldDeclarations.selectedChoices.baseType).toBe('identifier');
    expect(declaration.fieldDeclarations.selectedChoices.cardinality).toBe('multiple');
    expect(declaration.fieldDeclarations.coordinates.baseType).toBe('point');

    // Test that the parsed default value has the correct structure
    expect(declaration.defaultValue).toEqual({
      studentName: 'John',
      selectedChoices: ['A', 'C'],
      coordinates: [10, 20],
    });

    // Test validation with complex types
    expect(
      declaration.isValueCompatible({
        studentName: 'Jane',
        selectedChoices: ['B', 'D', 'E'],
        coordinates: [5, 15],
      }),
    ).toBe(true);

    // Test invalid complex types
    expect(
      declaration.isValueCompatible({
        studentName: 'Jane',
        selectedChoices: 'B', // Should be array for multiple cardinality
        coordinates: [5, 15],
      }),
    ).toBe(false);

    expect(
      declaration.isValueCompatible({
        studentName: 'Jane',
        selectedChoices: ['B', 'D'],
        coordinates: [5], // Should be array of length 2 for point
      }),
    ).toBe(false);
  });
});

describe('Pure compatibility functions', () => {
  test('areTypesCompatible should work with all type combinations', () => {
    // Same types
    expect(areTypesCompatible(BASE_TYPE.STRING, BASE_TYPE.STRING)).toBe(true);
    expect(areTypesCompatible(BASE_TYPE.BOOLEAN, BASE_TYPE.BOOLEAN)).toBe(true);
    expect(areTypesCompatible(BASE_TYPE.INTEGER, BASE_TYPE.INTEGER)).toBe(true);
    expect(areTypesCompatible(BASE_TYPE.FLOAT, BASE_TYPE.FLOAT)).toBe(true);

    // Numeric compatibility
    expect(areTypesCompatible(BASE_TYPE.INTEGER, BASE_TYPE.FLOAT)).toBe(true);
    expect(areTypesCompatible(BASE_TYPE.FLOAT, BASE_TYPE.INTEGER)).toBe(true);

    // Non-compatible types
    expect(areTypesCompatible(BASE_TYPE.STRING, BASE_TYPE.BOOLEAN)).toBe(false);
    expect(areTypesCompatible(BASE_TYPE.INTEGER, BASE_TYPE.STRING)).toBe(false);
    expect(areTypesCompatible(BASE_TYPE.FLOAT, BASE_TYPE.BOOLEAN)).toBe(false);
    expect(areTypesCompatible(BASE_TYPE.POINT, BASE_TYPE.PAIR)).toBe(false);
  });

  test('areDeclarationsCompatible should check both cardinality and base types', () => {
    const singleInt = createDeclaration(
      '<qti-response-declaration identifier="A" base-type="integer" cardinality="single" />',
    );
    const singleFloat = createDeclaration(
      '<qti-response-declaration identifier="B" base-type="float" cardinality="single" />',
    );
    const multipleInt = createDeclaration(
      '<qti-response-declaration identifier="C" base-type="integer" cardinality="multiple" />',
    );
    const singleString = createDeclaration(
      '<qti-response-declaration identifier="D" base-type="string" cardinality="single" />',
    );

    // Compatible: same cardinality, compatible types
    expect(areDeclarationsCompatible(singleInt, singleFloat)).toBe(true);

    // Incompatible: different cardinality
    expect(areDeclarationsCompatible(singleInt, multipleInt)).toBe(false);

    // Incompatible: different base types
    expect(areDeclarationsCompatible(singleInt, singleString)).toBe(false);

    // Compatible: same everything
    expect(areDeclarationsCompatible(singleInt, singleInt)).toBe(true);
  });
});
