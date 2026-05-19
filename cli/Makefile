.PHONY: build install clean

BINARY=tagent
VERSION=0.3.0

build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(BINARY) .

install: build
	cp $(BINARY) /usr/local/bin/$(BINARY)

# Cross-compile for all platforms
release:
	GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o dist/tagent-linux-amd64 .
	GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o dist/tagent-linux-arm64 .
	GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o dist/tagent-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o dist/tagent-darwin-arm64 .
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o dist/tagent-windows-amd64.exe .

clean:
	rm -f $(BINARY)
	rm -rf dist/
