# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Runner:**
- Jest (detected in vendored 5etools-v2.23.0 code only)
- Config: `projects/dnd-dm-screen/5etools-v2.23.0/jest.config.json`

**Assertion Library:**
- Jest built-in `expect()` API

**Run Commands:**
```bash
# No test commands defined in package.json
# Portfolio projects have no test infrastructure
```

**Coverage:**
- No coverage configuration detected
- Vendor code (5etools) has minimal Jest tests

## Test File Organization

**Location:**
- Vendor tests only: `projects/dnd-dm-screen/5etools-v2.23.0/test/jest/*.test.js`
- Portfolio projects: **No tests present**

**Naming:**
- Pattern: `{Feature}.test.js` (vendor code only)
- Examples: `ToTitleCase.test.js`, `StripTags.test.js`, `CrToPb.test.js`

**Structure:**
```
5etools-v2.23.0/
├── test/
│   ├── jest/                    # Unit tests (8 files)
│   ├── test-*.js                # Integration tests (various)
│   └── util-test.js             # Test utilities
```

## Test Structure

**Suite Organization:**
```javascript
import "../../js/parser.js";
import "../../js/utils.js";
import "../../js/render.js";

describe("Title-case strings", () => {
	it("Should handle lower-case strings", () => {
		expect("hello world".toTitleCase()).toBe("Hello World");
	});

	it("Should handle always-caps words", () => {
		expect("d&d".toTitleCase()).toBe("D&D");
	});
});
```

**Patterns:**
- Import source files before tests
- `describe()` blocks for feature groups
- `it()` blocks with descriptive "Should..." statements
- Direct method calls on prototypes (no test setup required)

## Mocking

**Framework:** Jest built-in mocking (vendor code only)

**Patterns:**
- No mocking detected in existing tests
- Tests operate on real implementations
- Pure function testing (no external dependencies)

**What to Mock:**
- Not applicable (portfolio has no tests)

**What NOT to Mock:**
- Utility functions (tested directly)

## Fixtures and Factories

**Test Data:**
- Inline test data in test files:
```javascript
expect("hello world".toTitleCase()).toBe("Hello World");
expect("the game of d&d".toTitleCase()).toBe("The Game of D&D");
```

**Location:**
- No separate fixtures directory
- Test data embedded in test cases

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# No coverage tooling configured
```

## Test Types

**Unit Tests:**
- Vendor code only: `5etools-v2.23.0/test/jest/*.test.js`
- Test utility functions: string formatting, data conversions
- No unit tests for portfolio projects

**Integration Tests:**
- Vendor code has integration test files: `test/test-*.js`
- Test data validation, image paths, tags
- Run with Node.js (not Jest): `node test/test-all.js`

**E2E Tests:**
- Not used
- No browser automation detected

## Common Patterns

**Async Testing:**
- Not detected in existing tests
- All vendor tests are synchronous

**Error Testing:**
- Not detected in existing tests
- Focus on happy path validation

## Current State: No Portfolio Testing

**Key Findings:**
- Portfolio projects (`projects/dnd-dm-screen/js/`, `projects/4-track/`, etc.) have **zero tests**
- Only vendored 5etools code has tests (8 Jest tests for utility functions)
- No test infrastructure in `package.json` scripts
- No testing libraries in dependencies

**Manual Testing Approach:**
- Projects use console logging for debugging
- Browser-based manual QA
- No automated regression testing

**Testing Anti-Patterns Detected:**
- Audio/game initialization not validated
- Complex UI logic untested (e.g., `displayAssociations()` in Textscape)
- No error handling verification
- No API response validation (data loading)

## If Adding Tests (Recommendations)

**Setup Required:**
1. Add Jest to `package.json` dependencies
2. Create `jest.config.js` for browser environment
3. Add npm scripts: `"test"`, `"test:watch"`, `"test:coverage"`
4. Install @testing-library/dom for UI testing

**Priority Test Targets:**
1. **Data Loading** (`projects/dnd-dm-screen/js/data-loader.js`)
   - Test JSON parsing
   - Test error handling for missing files

2. **Dice Rolling** (`projects/dnd-dm-screen/js/dice-roller.js`)
   - Test dice expression parsing
   - Test roll calculations
   - Test advantage/disadvantage logic

3. **Audio Context** (multiple projects)
   - Mock Web Audio API
   - Test state transitions (suspended → running)

4. **Game Logic** (`assets/js/roguelike-engine.js`)
   - Test player movement
   - Test collision detection
   - Test NPC interaction range

**Test Structure Example:**
```javascript
// dice-roller.test.js
import DiceRoller from './dice-roller.js';

describe('DiceRoller', () => {
    let roller;

    beforeEach(() => {
        roller = new DiceRoller();
    });

    describe('parseAndRoll', () => {
        it('should parse simple dice expression', () => {
            const result = roller.parseAndRoll('2d6');
            expect(result).toBeGreaterThanOrEqual(2);
            expect(result).toBeLessThanOrEqual(12);
        });

        it('should handle modifiers', () => {
            const result = roller.parseAndRoll('1d20+5');
            expect(result).toBeGreaterThanOrEqual(6);
            expect(result).toBeLessThanOrEqual(25);
        });

        it('should reject invalid expressions', () => {
            expect(() => roller.parseAndRoll('invalid'))
                .toThrow('Invalid dice expression');
        });
    });
});
```

---

*Testing analysis: 2026-01-18*
