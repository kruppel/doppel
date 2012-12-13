# CLI tools
GRUNT :=./node_modules/.bin/grunt
MOCHA :=./node_modules/.bin/mocha
TESTS := test/**/*.mocha.js

GREP ?=.*

# JSHint!
lint: $(GRUNT); $(GRUNT) lint

# Watch filesystem and run JSHint
watch: $(GRUNT); $(GRUNT) watch

# Run the tests
test: lint
	NODE_ENV=test $(MOCHA) --grep "$(GREP)" $(TESTS)

# Run the tests with the debugger
test-debug: $(MOCHA); NODE_ENV=test $(MOCHA) --debug-brk --grep "$(GREP)" $(TESTS)

.PHONY: lint watch test test-debug
