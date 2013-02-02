# CLI tools
GRUNT :=./node_modules/.bin/grunt
MOCHA :=./node_modules/.bin/mocha
TESTS := test/**/*.mocha.js

GREP ?=.*

# Build the man page
man:
	ronn --roff man/doppel.1.ronn

# JSHint!
lint: $(GRUNT); $(GRUNT) lint

# Watch filesystem and run JSHint
watch: $(GRUNT); $(GRUNT) watch

# Run the tests
test: lint
	NODE_ENV=test $(MOCHA) --grep "$(GREP)" $(TESTS)

# Run the tests with the debugger
test-debug: $(MOCHA); NODE_ENV=test $(MOCHA) --debug-brk --grep "$(GREP)" $(TESTS)

.PHONY: man lint watch test test-debug
